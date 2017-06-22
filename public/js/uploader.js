/**
 * OpenChannel library to upload files and images using the OpenChanngel API. The plugin is based on jQuery.
 * The plugin should be applied to a file input.
 */
(function($){

  /** ***************************************
   * File Uploader
   * ***************************************/

  /**
   * Flag to indicate if uploader was already initialized for the element.
   */
  $.fn.uploaderInitialized = false;

 	//create uploader of files
 	$.fn.fileUploader = function(options){
    //validate if element is a file input
    if("INPUT" != this.prop("tagName").toUpperCase() || "FILE" != this.attr("type").toUpperCase()){
      console.error("Invalid HTML element for uploader", this);
      return this;
    }

    //check if element is already initialized
    if(this.uploaderInitialized)
      return this;

    /**
     * Function to initialize uploader
     */
    var initUploader = function(e, settings){
      //merge with default settings
      settings = $.extend({
        basePath: '/'
      }, settings);

      //add listener on changes of the input file
      e.change(function(){

        //check if there are files to upload
        var files = e.prop("files");
        //for each file, upload it to the WP server and then it is sent to the OpenChannel API
        for (var i = 0; i < files.length; i++) {
          //create closure to avoid overwritten on requests
          (function(i){
            //prepare the file to send
            var file = files.item(i);
            var formdata = new FormData();
            formdata.append("file", file);

            //create XHR for ajax request
            var ajax = new XMLHttpRequest();
            ajax.open("POST", settings.basePath + 'marketplace/files', true);

            //add listeners to the request
            ajax.onreadystatechange = function () {
              if(ajax.readyState == 4){
                if(ajax.status == 200){
					if(settings.success){
						settings.success(JSON.parse(ajax.responseText), file);
					}
				}
                else{
                  if(settings.fail){
					settings.fail(file, ajax);
				  }
				}
              }
            };
            ajax.upload.addEventListener("progress", function(ev){
				if(settings.progress){
					return settings.progress(file, ev);
				}
            });
            ajax.addEventListener("error", function(){
				if(settings.fail){
					settings.fail(file, ajax);
				}
            });
            
            //send the request
            ajax.send(formdata);
          })(i);
        }
      });

      //mark uploaded as initalized
      e.uploaderInitialized = true;
    };
    
    //initialize element
    initUploader(this, options);

    return this;
 	}


  /** ***************************************
   * Image Uploader
   * ***************************************/

  /**
   * Flag to indicate if image uploader was already initialized for the element.
   */
  $.fn.imageUploaderInitialized = false;

  /**
   * Uploader settings
   */
  $.fn.imageUploaderSettings = null;

  //create uploader of files
  $.fn.imageUploader = function(options, actionParam){

    //validate if element is a file input
    if("INPUT" != this.prop("tagName").toUpperCase() || "FILE" != this.attr("type").toUpperCase()){
      console.error("Invalid HTML element for uploader", this);
      return this;
    }

    /**
     * Function to upload an image
     */
    var uploadImage = function(e, file){
      var settings = e.imageUploaderSettings;
      //validate if file is an image
      var fileType = file["type"];
      var validImageTypes = ["image/gif", "image/jpeg", "image/png"];
      if($.inArray(file["type"], validImageTypes) < 0) {
        console.error("Please provide an image");
		
		if(settings.fail){
			settings.fail(file);
		}
        return false;
      }

      //get uploader settings
      var settings = e.imageUploaderSettings;

      //check image dimension
      var img = new Image;
      img.src = URL.createObjectURL(file);
      img.onload = function(){
        //if image dimensions is different to settings dimensions (+/- 1px)
        if(settings.width != undefined && settings.height != undefined){
			if(img.width > settings.width +1 || img.width < settings.width -1 || img.height > settings.height +1 || img.height < settings.height -1){
				//resize image
				if(settings.resize){
				  file = settings.resize(file);
				  if(!file){
					console.log("Expected dimensions for image are: " + settings.width + "x" + settings.height);
					return false;
				  }
				}
			}
        }

        //prepare the file to send
        var formdata = new FormData();
        formdata.append("file", file);

        //create XHR for ajax request
        var ajax = new XMLHttpRequest();
        ajax.open("POST", settings.basePath + 'marketplace/files');

        //add listeners to the request
        ajax.onreadystatechange = function () {
          if(ajax.readyState == 4){
            if(ajax.status == 200){
				if(settings.success){
					settings.success(JSON.parse(ajax.responseText), file);
				}
			}
            else{
				if(settings.fail){
					settings.fail(file, ajax);
				}
			}
          }
        };
        ajax.upload.addEventListener("progress", function(ev){
			if(settings.progress){
				return settings.progress(file, ev);
			}
        });
        ajax.addEventListener("error", function(){
			if(settings.fail){
				settings.fail(file, ajax);
			}
        });
        
        //send the request
        ajax.send(formdata);

      }//image is loaded
    }

    //check if an action is invoked
    if(this.imageUploaderInitialized && "string" == typeof options){
      //check if it is a valid action and invoke its method
      switch(options){
        case "upload":
          return uploadImage(this, actionParam);
        default:
          return false;
      }
    }

    //check if element is already initialized
    if(this.imageUploaderInitialized)
      return this;

    /**
     * Function to initialize uploader
     */
    var initUploader = function(e, settings){
      //merge with default settings
      e.imageUploaderSettings = $.extend({
        basePath: '/'
      }, settings);

      //validate width and height parameters
      var requiredIntegers = ['width', 'height'];
      for(var i in requiredIntegers)
        if(settings[requiredIntegers[i]] != undefined && "number" != typeof settings[ requiredIntegers[i] ]){
          console.error("An integer value is required for " + requiredIntegers[i]);
          return false;
        }

      //add listener on changes of the input file
      e.change(function(){
        //check if there are files to upload
        var files = e.prop("files");
        //for each file, upload it to the WP server and then it is sent to the OpenChannel API
        for (var i = 0; i < files.length; i++) {
          //upload the image
          uploadImage(e, files.item(i));
        }
      });

      //mark uploaded as initalized
      e.imageUploaderInitialized = true;
    };
    
    //initialize element
    initUploader(this, options);

    return this;
  }
}(jQuery));