# Strapi Upload Multiple Provider

Allow multiple upload providers in strapi.

The selection of which provider to use is determined by a *selectProvider* function in settings with file information. Each provider is identified by *keyString*.

Each provider plugin need to be installed.


config/plugins.js:
```
upload: {
  provider: "multiple-provider",
  providerOptions: {
    selectProvider(file) {
      // return some key string
    },
    providers: {
      'key1' : {
        provider: #providerName#,
        options: #providerOptions#
      },
      'key2' : {
        provider: #providerName#,
        options: #providerOptions#
      },
      ...
    }  
  }  
}
```


A more complete example:

config/plugins.js:
```
upload: {
  provider: "multiple-provider",
  providerOptions: {
    selectProvider(file) {
      if(file.name.match(/\.pdf$/))
        return 'documents'
      else if(file.name.match(/\.(jpe?g|png|webp|svg)$/))
        return 'images'
      else
        return 'default'
    },
    providers: {
      'default' : {
        provider: 'local',
      },
      'images' : {
         provider: 'google-cloud-storage',
         options: { 
           bucketName: 'mybucketimages',
           publicFiles: true,
           uniform: true,
           basePath: "",
        }
      },
      'documents': {
         provider: 'google-cloud-storage',
         options: {    
           bucketName: 'mybucketdocuments',
           publicFiles: true,
           uniform: true,
           basePath: "",
        }
      }
    }  
  }  
}
```
