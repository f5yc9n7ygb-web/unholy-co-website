const Module = require("node:module")
const path = require("node:path")

const originalResolveFilename = Module._resolveFilename
const root = path.resolve(__dirname, "..")

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(root, "src", request.slice(2)),
      parent,
      isMain,
      options,
    )
  }

  return originalResolveFilename.call(this, request, parent, isMain, options)
}
