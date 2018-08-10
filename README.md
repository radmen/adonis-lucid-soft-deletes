# Adonis Lucid Soft Deletes

This is an experimental Lucid Addon which adds support for soft deletes. It's based on [PR #315](https://github.com/adonisjs/adonis-lucid/pull/315) created by me.

This code should be treated as *experimental* and *likely unstable*. You're using it on your own responsibility.

## Installation

```
adonis install @radmen/adonis-lucid-soft-deletes

# for yarn users
adonis install @radmen/adonis-lucid-soft-deletes --yarn
```

Next, make sure to read the [instructions.md](https://github.com/radmen/adonis-lucid-soft-deletes/blob/master/instructions.md) file.

## Usage

### Removing model

Default `delete()` method will mark model as soft-deleted (it will set current date in `deleted_at` attribute).

If you'd like to _really_ remove the model pass `{ force: true }` as a first argument to the method.

### Restoring model

To restore deleted model use `restore()` method. Note that it will work **only** for soft-deleted models.

### Scopes

Trait will append global scope which includes only records with `deleted_at = NULL`.

It's possible to query model with deleted records. To do so, use `withTrashed()` method.

If you want to get _only_ deleted records, use `onlyTrashed()` method.

### Getters

Trait will append the following getters to the model:

* `isTrashed` returns `TRUE` when model has `deleted_at !== NULL`
* `wasTrashed` returns `TRUE` only when model _was_ deleted but it got `restore`'d.

### Hooks

For either soft or force delete, `beforeDelete`/`afterDelete` hooks will be triggered.

When a model is being restored it will trigger `beforeRestore`/`afterRestore` hooks.

## Hacks, workarounds

### `isDeleted`

By default, Adonis Models can't be updated if they've been deleted. When this happens `isDeleted` returns `TRUE` and no change is possible. This prevents from using soft deletes so the trait changes this behavior. `isDeleted` **will always return FALSE**. 

This may generate some unexpected problems, yet they didn't occur to me.

### Monkey patches

To make things work I had to monkey patch some of Adonis Lucid components:

#### Model

* every model has `usesSoftDeletes` static attribute. By default it returns `false`. If a model uses `Lucid/SoftDeletes` trait this attribute will return `true`.
* `query()` static method will return patched version of `QueryBuilder`

#### Lucid/QueryModel

If a `Model` uses soft-deletes `delete()` method will mark matching records as soft-deleted.

To remove matching records pass `{ force: true }` as a first argument.

## Known bugs

### Global scope with `OR` statements

It's possible to ignore global scope by mistake. This can happen when one uses `orWhere` methods (in general any `OR` statement):

```js
User.where('name', 'Jon').orWhere('name', 'Array')
```

To avoid that you should group such statements:

```js
User.where(function () {
  this.where('name', 'Jon')
    .orWhere('name', 'Array')
})
```

## Testing

To run tests use `npm test`. By default, it will use `sqlite` as default database backend.

It's possible to run tests against `postgres` or `mysql` database backends. This requires Docker to be installed.

If you want to run tests using `mysql` driver:

```bash
NODE_ENV=mysql .travis/setUp.sh
NODE_ENV=mysql npm test

# remove the database
.travis/tearDown.sh
```

Available databases:

* `mysql` will use the latest mysql
* `mysql5` will use latest mysql 5.x
* `postgres` will use latest postgres
* `postgres9` will use latest postgres 9.x 

## Why separate package?

I've created _hacky_, simple trait implementing basics for soft deletes. It was taken from a project of mine, where it was _good enough_ to be used.

Since this feature is on Adonis roadmap I thought that it can be used as a baseline for official Adonis implementation. I've started a PR and left some questions.
Some of them were answered, some of them not. This prevented me from further development.

Since there's a high demand for this feature, I was asked to publish it as a separate package and allow the community to check it and leave feedback.  
After some consideration, I think that it's a good idea.

The goal of this package is to test it, gather feedback, improve and eventually back-port to Adonis.  
I'm not an active Adonis user so community support is required.
