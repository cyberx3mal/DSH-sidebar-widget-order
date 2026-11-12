# Подключить свой виджет к общему порядку

Русский | [English](ADD-WIDGET.en.md)

Виджет участвует в общем порядке, если при регистрации в `sidebar.footer.action` он:

1. берёт `order` из общего списка;
2. перерегистрируется по событию `dsh/sidebar-footer-order`;
3. задаёт уникальный `id` и осмысленный `label`.

## 1. Хелпер

Скопируй этот блок в фабрику `client.js` (рядом с телом плагина):

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

## 2. Регистрация

Вместо одного фиксированного `register` используй заменяемую запись:

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
        id: 'my-widget-foot',          // уникальный и стабильный
        order: sidebarOrder('my-widget-foot', 100),
        label: () => tr('panel'),      // показывается на странице порядка
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

## Правила

- `id` уникален среди записей футера и не меняется между версиями.
- `fallback` — позиция до первой перестановки; выбери число рядом с соседями
  (у штатных виджетов это 20, 30 и -10).
- Состояние виджета держи вне компонента (стор или `localStorage`): при
  перестановке компонент один раз размонтируется.
- В disposer'е снимай listener и запись, как в примере выше.

## Как это работает

Страница порядка пишет массив id в `localStorage` и отправляет событие
`dsh/sidebar-footer-order`. Виджет по событию делает dispose + `register` с новым
`order`. Страница не читает и не меняет компоненты других плагинов.

## Ограничения

- Порядок локальный для браузера.
- Виджет, выключенный в момент перестановки, выпадает из сохранённого списка и при
  включении использует свой `fallback`, пока его снова не подвинуть.
