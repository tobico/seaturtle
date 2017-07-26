export const addView = (element, view) => {
  element.append(view.element())
  view.load()
}
