# Sidebar widget order for DSH

[Русский](README.md) | English

A DeepSeek Harness plugin that reorders the widgets in the bottom of the left sidebar
(`sidebar.footer.action`) with ↑ and ↓ arrows. The arrows live only on the settings
page — widgets themselves never show reorder controls.

## Install

1. Copy the plugin folder somewhere convenient.
2. In DSH open **Settings → Plugins → Add plugin** and select that folder.
   With the CLI: `dsh plugin --profile desktop add "<path-to-folder>"`
   (replace `desktop` with your profile name).
3. Enable the plugin in the list and refresh the page (Ctrl+R).

## Usage

1. Open **Settings** (bottom left).
2. Select the **Widget order** section.
3. Move widgets with ↑ and ↓ — the order applies immediately.

The order is saved in the browser under `dsh.sidebar.footer.order.v1` and survives a
restart. It is local: configure it again on another computer.

## How it works

The page saves the id list in `localStorage` and emits the `dsh/sidebar-footer-order`
event. Every widget disposes its footer registration and registers it again with the
new `order = (position + 1) × 10`. The page never touches another plugin's components,
styles or DOM and is idle while Settings is closed.

## Your own widget

A new widget appears in the list automatically: the page reads the live entries through
`ctx.slots.entries('sidebar.footer.action')`, with no hardcoded list. The row label
comes from the registration `label`, otherwise from the `id`.

To take part in the order, a widget reads `order` from the shared list and re-registers
after the shared event. Ready-to-copy template and rules:
[docs/ADD-WIDGET.en.md](docs/ADD-WIDGET.en.md).

## Limitations

- The order is stored in the browser, not in the DSH profile: set it again on another
  device.
- A widget that is disabled while you reorder falls back to its own default `order`
  when it returns, until you move it again.
