## Registering provider

Make sure to register the soft deletes provider inside `start/app.js`

```js
const providers = [
  'igg-adonis-lucid-soft-deletes/providers/SoftDeletesProvider'
]
```

## Usage

Once done you can access register the trait as follows.

```js
const Model = use('Model')

class Post extends Model {
  static boot () {
    super.boot()

    this.addTrait('@provider:Lucid/SoftDeletes')
  }
}
```
If you would like to register the trait with another deletion column name, you can do as follows.

```js
const Model = use('Model')

class Post extends Model {
  static boot () {
    super.boot()

    this.addTrait('@provider:Lucid/SoftDeletes', {
      deletedAtColumn: 'column_name'
    })
  }
}
```
## DB Schema

Make sure, that your models table has `deleted_at` timestamp column.
