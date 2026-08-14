#!/usr/bin/env node

import { Context } from '@lanshi17/cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@lanshi17/cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@lanshi17/cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
