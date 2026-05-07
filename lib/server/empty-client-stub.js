// Empty client-side stub for server-only modules.
// When webpack's client compiler encounters a dynamic import of a server-only
// module (e.g. inside getServerSideProps), this stub is used instead of the
// actual module. The real module (with "server-only" guard) is only loaded
// during server-side rendering.
//
// This file must never export anything meaningful. If client code somehow
// reaches this stub at runtime, it means a server-only module was incorrectly
// imported outside of a server execution path.
module.exports = {};
