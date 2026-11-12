# Add your own widget to the shared order

[Русский](ADD-WIDGET.md) | English

A widget takes part in the shared order when its `sidebar.footer.action` registration:

1. reads `order` from the shared list;
2. re-registers after the `dsh/sidebar-footer-order` event;
3. provides a unique `id` and a meaningful `label`.

## 1. Helper

Copy this block into the `client.js` factory (near the plugin body):

```js
/* ---- Sidebar footer order (shared convention with @local/sidebar-widget-order) ---- */
const SIDEBAR_ORDER_KEY = 'dsh.sidebar.footer.order.v1'
const SIDEBAR_ORDER_EVENT = 'dsh/sidebar-footer-order'

const readSidebarOrder = () => {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(SIDEBAR_ORDER_KEY)
    const list = raw === null ? [] : JSON.parse(raw)
    return Array.isArray(list) ? list.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}

const sidebarOrder = (id, fallback) => {
  const index = readSidebarOrder().indexOf(id)
  return index < 0 ? fallback : (index + 1) * 10
}
```

## 2. Registration

Replace one fixed `register` call with a replaceable entry:

```js
ctx.slots.inject('sidebar.footer.action', () => {
  let disposeEntry
  let live = true

  const install = () => {
    if (!live) return
    if (disposeEntry !== undefined) disposeEntry()
    disposeEntry = ctx.slots.register(
      {
        name: 'sidebar.footer.action',
        id: 'my-widget-foot',          // unique and stable
        order: sidebarOrder('my-widget-foot', 100),
        label: () => tr('panel'),      // shown on the order page
        locale: NS,
        inject: () => ({ /* ... */ }),
      },
      MyWidgetFooter,
    )
  }

  install()
  const off = ctx.on(SIDEBAR_ORDER_EVENT, install)
  return () => {
    live = false
    off()
    if (disposeEntry !== undefined) disposeEntry()
  }
})
```

## Rules

- `id` is unique among footer entries and stays stable across releases.
- `fallback` is the position before the first move; pick a number near its neighbours
  (the shipped widgets use 20, 30 and -10).
- Keep widget state outside the component (a store or `localStorage`): a move remounts
  the component once.
- Remove the listener and the entry in the disposer, as shown above.

## How it works

The order page writes the id array to `localStorage` and emits the
`dsh/sidebar-footer-order` event. Each widget disposes and registers again with the new
`order`. The page never reads or changes another plugin's components.

## Limitations

- The order is local to the browser.
- A widget disabled while you reorder drops out of the saved list and uses its
  `fallback` when it returns, until you move it again.
