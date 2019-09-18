# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v0.1.3] - 2019-09-18
### Fixed
- append `deleted_at` to `Model.dates`

## [v0.1.2] - 2018-08-10
### Fixed
- Patch `QueryBuilder` when requested (via `Model.query()` method)

## [v0.1.1] - 2018-08-08
### Fixed
- `delete()` ran from context of `QueryBuilder` will mark matching records as soft-deleted

## [v0.1.0] - 2018-07-26
### Added
- `soft_deletes` global scope
- `delete()` method
- `restore()` method
- `withTrashed()` scope
- `onlyTrashed()` scope
- `isTrashed` getter
- `wasTrashed` getter

[Unreleased]: https://github.com/radmen/adonis-lucid-soft-deletes/compare/v0.1.3...HEAD
[v0.1.3]: https://github.com/radmen/adonis-lucid-soft-deletes/compare/v0.1.2...v0.1.3
[v0.1.2]: https://github.com/radmen/adonis-lucid-soft-deletes/compare/v0.1.1...v0.1.2
[v0.1.1]: https://github.com/radmen/adonis-lucid-soft-deletes/compare/v0.1.0...v0.1.1
[v0.1.0]: https://github.com/radmen/adonis-lucid-soft-deletes/compare/1d06747...v0.1.0
