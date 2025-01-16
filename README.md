# Liquid Refactors

Refactors for a smoother Shopify theme building experience.

## Features

### Locale refactors

![A user highlights the string "Page {{ paginate.current_page }} of {{ paginate.pages }}" inside a Liquid file. After triggering the "Extract to Locales" code refactor, a prompt appears asking the user to input a key. The user types "pagination.page_current_page_of_pages". After hitting enter, the highlighted text is moved into the default locales file, and replaced in the liquid file with a Liquid tag to render the newly created locale. The "paginate.current_page" and "paginate.pages" variables are automatically passed into the translate filter. The user then moves their cursor to the "current_page" filter and triggers the "Rename locale variable" refactor, renaming it "x" in both the Liquid file, and the locale JSON file. The user repeats this action with the "pages" variable to rename it "y".](./images/locale-refactors.gif)

- Extract to locales

  Moves your selection into `locales/*.default.json`, including any variables you're passing to it.

- Rename locale variable

  Renames a variable in your locale. The corresponding string inside `locales/*.default.json` will have its variable updated.

### Schema Refactors

![A user is viewing "sections/quote-carousel.liquid". The section has a hardcoded title and a list with one item for every block, but each item is hardcoded. The user highlights the harcoded title text and triggers the "Extract to schema setting" refactor. When asked for a setting name, they submit "Title". Their selection is replaced with "{{ section.settings.title }}" and a new "Title" settings is injected into the section schema. Next, the user highlights the harcoded list item text and triggers the "Extract to block setting" refactor. The user selects the "Quote" block that already exists in the section schema, and enters "Quote" for the setting name. Their selection is replaced with "{{ block.settings.quote }}" and the section schema has a new "Quote" setting added to the "Quote" blocks.](./images/schema-refactors.gif)

- Add schema setting

  Adds a text setting to your section/block schema. The setting will automatically use the selection as the default value.

- Add block setting

  Adds a text setting to your section block schema. The setting will automatically use the selection as the default value.
