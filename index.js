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

const { convertToStrapiError } = require('../../strapi-plugin-upload/errors')

const wrapFunctionForErrors = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (err) {
    throw convertToStrapiError(err)
  }
}

const getProviderData = (file, options) => {
  console.log('getProviderData')
  // console.log('file', file)
  console.log('options', options)

  if(!options.selectProvider || typeof options.selectProvider !== 'function')
  {
    strapi.log.error('selectProvider not found')
    throw new Error(
      `config must define a selectProvider function`
    )
  }

  try {
    const providerKey = options.selectProvider(file)
    console.log('providerKey', providerKey)
    try {
      const p = options.providers[providerKey]
      console.log('p=>', p)
      try {
        const providerInstance = require(`strapi-provider-upload-${p.provider}`).init(
          p.options
        )

        console.log('provider instance created', providerInstance)

        const providerFunctions = Object.assign(Object.create(baseProvider), {
          ...providerInstance,
          upload: wrapFunctionForErrors(file => {
            console.log('going to call providerInstance.upload(file, options)')
            console.log('options: ', options)
            return providerInstance.upload(file, p.options)
          }),
          delete: wrapFunctionForErrors(file => {
            return providerInstance.delete(file, p.options)
          })
        })

        console.log('providerFunctions created', providerFunctions)

        return { providerFunctions, providerOptions: p.options }
      } catch (err) {
        strapi.log.error(err)
        throw new Error(
          `The provider package isn't installed. Please run \`npm install strapi-provider-upload-${p.provider}\``
        )
      }
    } catch (err) {
      strapi.log.error(err)
      throw new Error(
        `The upload provider selector with key '${providerKey}' not found`
      )
    }
  } catch (err) {
    strapi.log.error(err)
    throw new Error(
      `The function selectProvider generated error`
    )
  }
}

module.exports = {
  init (options) {

    return {
      upload (file) {
        console.log('my provider.upload')
        // console.log('file', file)
        console.log('options', options)
        try {
          const { providerFunctions, providerOptions } = getProviderData(
            file,
            options
          )
          console.log('going to upload')
          console.log(providerOptions)
          return providerFunctions.upload(file, providerOptions)
        } catch (err) {
          return null
        }
      },
      delete (file) {
        console.log('my provider.delete')
        console.log('file', file)
        console.log('options', options)
        try {
          const { providerFunctions, providerOptions } = getProviderData(
            file,
            options
          )
          return providerFunctions.delete(file, providerOptions)
        } catch (err) {
          return null
        }
      }
    }
  }
}
