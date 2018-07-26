## Registering provider

Make sure to register the soft deletes provider inside `start/app.js`

```js
const providers = [
  '@radmen/adonis-lucid-soft-deletes/providers/SoftDeletesProvider'
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

## DB Schema

Make sure, that your models table has `deleted_at` timestamp column.
