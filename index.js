'use strict'

const baseProvider = {
  extend (obj) {
    Object.assign(this, obj)
  },
  upload () {
    throw new Error('Provider upload method is not implemented')
  },
  delete () {
    throw new Error('Provider delete method is not implemented')
  }
}

// removed reliance on strapi v3 api
// const { convertToStrapiError } = require('../strapi-plugin-upload/errors')

const wrapFunctionForErrors = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (err) {
    // throw convertToStrapiError(err)
    strapi.log.error(err)
    throw new Error(err)
  }
}

const getProviderData = (file, options) => {
  if (!options.selectProvider || typeof options.selectProvider !== 'function') {
    const msg = `config must define a selectProvider function`
    strapi.log.error(msg)
    throw new Error(msg)
  }

  let providerKey
  try {
    providerKey = options.selectProvider(file)
  } catch (err) {
    const msg = `The function selectProvider generated error`
    strapi.log.error(msg)
    strapi.log.error(err)
    throw new Error(msg)
  }

  if (!options.providers) {
    const msg = `You must set providers object in providerOptions of config/plugins.js`
    strapi.log.error(msg)
    throw new Error(msg)
  }

  const p = options.providers[providerKey]
  if (!p) {
    const msg = `The upload provider selector with key '${providerKey}' not found`
    strapi.log.error(msg)
    throw new Error(msg)
  }

  let providerInstance
  try {
    providerInstance = require(`${p.provider}`).init(
      p.options
    )
  } catch (err) {
    const msg = `The provider package isn't installed. Please run \`npm install ${p.provider}\``
    strapi.log.error(msg)
    throw new Error(msg)
  }

  const providerFunctions = Object.assign(Object.create(baseProvider), {
    ...providerInstance,
    upload: wrapFunctionForErrors(file => {
      return providerInstance.upload(file)
    }),
    // uploadStream: wrapFunctionForErrors(file => {
    //  // needs its own implementation
    //   if (providerInstance.uploadStream) {
    //     return providerInstance.uploadStream(file)
    //   } else {
    //     return providerInstance.upload(file)
    //   }
    // }),
    delete: wrapFunctionForErrors(file => {
      return providerInstance.delete(file)
    })
  })

  return { providerFunctions, providerOptions: p.options }
}

module.exports = {
  init (options) {
    return {
      upload (file) {
        try {
          const { providerFunctions, providerOptions } = getProviderData(
            file,
            options
          )
          return providerFunctions.upload(file)
        } catch (err) {
          return null
        }
      },
      // uploadStream(file) {
      //   try {
      //     const { providerFunctions, providerOptions } = getProviderData(
      //       file,
      //       options
      //     )
      //     return providerFunctions.uploadStream(file)
      //   } catch (err) {
      //     return null
      //   }
      // },
      delete (file) {
        try {
          const { providerFunctions, providerOptions } = getProviderData(
            file,
            options
          )
          return providerFunctions.delete(file)
        } catch (err) {
          return null
        }
      }
    }
  }
}
