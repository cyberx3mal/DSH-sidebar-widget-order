/**
 * Browser half of the sidebar widget order bundle.
 *
 * The settings page lists every live registration of `sidebar.footer.action`
 * and moves one entry up or down. The chosen order lives in one localStorage
 * key; every widget plugin reads that key when it registers and re-registers
 * after the `dsh/sidebar-footer-order` event. This page only writes the shared
 * key and emits the event, so it never touches another plugin's component,
 * styles or DOM, and widgets keep working when this page is not mounted.
 */
window.__ModuleLoader__.load({
  id: '@local/sidebar-widget-order',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'sidebarWidgetOrder'
    const SLOT = 'sidebar.footer.action'
    const ORDER_KEY = 'dsh.sidebar.footer.order.v1'
    const ORDER_EVENT = 'dsh/sidebar-footer-order'

    const dictionaries = {
      en: {
        'settings.nav': 'Widget order',
        intro: 'Widgets in the sidebar footer, in their current order. The arrows move one widget up or down.',
        empty: 'No widgets are registered in the sidebar footer yet.',
        moveUp: 'Move up',
        moveDown: 'Move down',
        saved: 'The order is saved in this browser and applied immediately.',
      },
      ru: {
        'settings.nav': 'Порядок виджетов',
        intro: 'Виджеты в нижней части боковой панели в текущем порядке. Стрелки двигают виджет вверх или вниз.',
        empty: 'В нижней части боковой панели пока нет виджетов.',
        moveUp: 'Выше',
        moveDown: 'Ниже',
        saved: 'Порядок сохраняется в этом браузере и применяется сразу.',
      },
    }

    /** Read the shared order list, tolerating missing storage and bad JSON. */
    function readOrder() {
      try {
        const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(ORDER_KEY)
        const list = raw === null ? [] : JSON.parse(raw)
        return Array.isArray(list) ? list.filter(id => typeof id === 'string') : []
      } catch {
        return []
      }
    }

    /** Persist the shared order list; private mode and quota errors keep this session's order only. */
    function writeOrder(list) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(ORDER_KEY, JSON.stringify(list))
      } catch {
        // The in-page order still changes for this session.
      }
    }

    /** Live entries of the footer slot; an undeclared slot counts as empty. */
    function slotEntries(ctx) {
      try {
        const entries = ctx.slots.entries(SLOT)
        return Array.isArray(entries) ? entries : []
      } catch {
        return []
      }
    }

    /** Ids of the live footer entries in their rendered order. */
    function currentIds(ctx) {
      return slotEntries(ctx)
        .filter(entry => entry !== undefined && entry !== null && entry.options !== undefined && typeof entry.options.id === 'string')
        .map((entry, index) => ({
          id: entry.options.id,
          order: typeof entry.options.order === 'number' ? entry.options.order : 0,
          index,
        }))
        .sort((a, b) => a.order - b.order || a.index - b.index)
        .map(item => item.id)
    }

    /** Display name for one entry: its locale-aware label, else its id. */
    function labelOf(ctx, id) {
      const entry = slotEntries(ctx)
        .find(candidate => candidate !== undefined && candidate !== null && candidate.options !== undefined && candidate.options.id === id)
      const label = entry === undefined ? undefined : entry.options.label
      if (typeof label === 'string' && label !== '') return label
      if (typeof label === 'function') {
        try {
          const value = label()
          if (typeof value === 'string' && value !== '') return value
        } catch {
          // A crashed label falls back to the id.
        }
      }
      return id
    }

    /** Persist a new order and ask every widget to re-register with its new `order`. */
    function moveWidget(ctx, id, delta) {
      const ids = currentIds(ctx)
      const from = ids.indexOf(id)
      const to = from + delta
      if (from < 0 || to < 0 || to >= ids.length) return
      ids.splice(to, 0, ids.splice(from, 1)[0])
      writeOrder(ids)
      ctx.emit(ORDER_EVENT)
    }

    /** A stable snapshot of the live footer order for the settings page. */
    function createOrderStore(ctx) {
      let snapshot = currentIds(ctx)
      const listeners = new Set()
      let queued = false

      const publish = () => {
        queued = false
        const next = currentIds(ctx)
        if (next.length === snapshot.length && next.every((id, index) => id === snapshot[index])) return
        snapshot = next
        for (const listener of [...listeners]) listener()
      }

      const schedule = () => {
        if (queued) return
        queued = true
        Promise.resolve().then(publish)
      }

      let off = () => {}
      try {
        off = ctx.slots.subscribe(SLOT, schedule)
      } catch (error) {
        console.error('[sidebar-widget-order] slot subscription failed', error)
      }

      return {
        subscribe(listener) {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        getSnapshot() {
          return snapshot
        },
        refresh: schedule,
        dispose() {
          off()
          listeners.clear()
        },
      }
    }

    function Chevron(props) {
      const up = props.direction === 'up'
      return h('svg', {
        viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true, focusable: false,
      }, h('path', {
        d: up ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
      }))
    }

    const CSS = `
.swo-root{display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:2px 0;}
.swo-intro,.swo-tip,.swo-empty{margin:0;color:var(--dsw-alias-label-secondary);font-size:12.5px;line-height:18px;}
.swo-tip{color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:17px;}
.swo-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none;border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;}
.swo-row{display:flex;align-items:center;gap:8px;min-height:38px;padding:6px 10px;border-top:.5px solid var(--dsw-alias-border-l2);box-sizing:border-box;}
.swo-row:first-child{border-top:0;}
.swo-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-primary);font-size:12.5px;line-height:18px;}
.swo-actions{display:flex;align-items:center;gap:2px;flex:none;}
.swo-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;}
.swo-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);}
.swo-btn:disabled{opacity:.35;cursor:default;}
.swo-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}
`

    function WidgetOrderSection(props) {
      const ids = React.useSyncExternalStore(props.store.subscribe, props.store.getSnapshot, props.store.getSnapshot)
      const t = props.tr
      return h('div', { className: 'swo-root' },
        h('style', {}, CSS),
        h('p', { className: 'swo-intro' }, t('intro')),
        ids.length === 0
          ? h('p', { className: 'swo-empty' }, t('empty'))
          : h('ul', { className: 'swo-list' },
            ids.map((id, index) => h('li', { key: id, className: 'swo-row' },
              h('span', { className: 'swo-label', title: id }, props.labelOf(id)),
              h('span', { className: 'swo-actions' },
                h('button', {
                  type: 'button',
                  className: 'swo-btn',
                  disabled: index === 0,
                  'aria-label': t('moveUp'),
                  title: t('moveUp'),
                  onClick: () => props.move(id, -1),
                }, h(Chevron, { direction: 'up' })),
                h('button', {
                  type: 'button',
                  className: 'swo-btn',
                  disabled: index === ids.length - 1,
                  'aria-label': t('moveDown'),
                  title: t('moveDown'),
                  onClick: () => props.move(id, 1),
                }, h(Chevron, { direction: 'down' })),
              ),
            )),
          ),
        h('p', { className: 'swo-tip' }, t('saved')),
      )
    }

    function OrderIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 16
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, 'aria-hidden': true, focusable: false,
      },
      h('path', {
        d: 'M5 3.5v9M5 12.5l-2.2-2.2M5 12.5l2.2-2.2',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M11 12.5v-9M11 3.5L8.8 5.7M11 3.5l2.2 2.2',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round',
      }))
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'sidebar-widget-order: dictionaries')
        const tr = ctx.locale.bind(NS)
        const store = createOrderStore(ctx)
        ctx.effect(() => () => store.dispose(), 'sidebar-widget-order: store')

        ctx.effect(
          () =>
            ctx.slots.inject('settings.section', () =>
              ctx.slots.register(
                {
                  name: 'settings.section',
                  id: 'sidebar-widget-order',
                  order: 55,
                  locale: NS,
                  label: () => tr('settings.nav'),
                  inject: () => ({
                    store,
                    tr,
                    labelOf: id => labelOf(ctx, id),
                    move: (id, delta) => moveWidget(ctx, id, delta),
                  }),
                },
                WidgetOrderSection,
              ),
            ),
          'sidebar-widget-order: settings section',
        )

        ctx.effect(
          () =>
            ctx.slots.inject('settings.section.icon', () =>
              ctx.slots.register(
                { name: 'settings.section.icon', id: 'sidebar-widget-order', order: 55 },
                OrderIcon,
              ),
            ),
          'sidebar-widget-order: settings icon',
        )
      },
    }
  },
})
