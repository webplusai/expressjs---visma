if(window.marketplace == undefined){
	marketplace={};
}

/*
* FILTER DEVELOPER APPS
* Returns relevant app listings for a developer.
*/
marketplace.filterDeveloperApps = function(apps){
	var filteredList = [];
	var rejected = {};
	var liveVersions = {};
			
	for(var i = 0; i < apps.list.length; i++){
		var isLive = apps.list[i].isLive;
		var status = apps.list[i].status.value;
		var version = apps.list[i].version;
		
		if(isLive || status == "inDevelopment" || status == "pending" || status == "inReview"){
			filteredList.push(apps.list[i]);
		}
		else if(status == "rejected" && (rejected[apps.list[i].appId] == undefined || rejected[apps.list[i].appId].version < version)){					
			rejected[apps.list[i].appId] = apps.list[i];
		}
		
		if(isLive){
			liveVersions[apps.list[i].appId] = version;
		}
	}

	for(var appId in rejected){
		if (rejected.hasOwnProperty(appId)){
			var version = rejected[appId].version;
			
			if(liveVersions[appId] == undefined || liveVersions[appId].version < version){
				filteredList.push(rejected[appId]);
			}
		}
	}
	
	return filteredList;
};


/*
* DEFAULT FLOT SETTINGS
* Default settings for flot graphs.
*/
marketplace.flotDefault = {
	yaxis: {
		min: 0,
	},
	xaxis: {
		mode: "time",
		tickSize: [2, "month"],
		monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		tickLength: 0
	},
	series: {
		lines: {
			show: true,
			fill: true,
			fillColor: { colors: [ { opacity: 0.4 }, { opacity: 0.1 } ] },
			lineWidth: 1.5
		},
		points: {
			show: true,
			radius: 2.5,
			lineWidth: 1.1,
			fill: true,
			fillColor: "#ffffff",
			symbol: "circle" // or callback
		},
		shadowSize: 0
	},
	grid: {
		hoverable: true,
		show: true,
		borderColor: "#efefef", // set if different from the grid color
		tickColor: "rgba(0,0,0,0.06)", // color for the ticks, e.g. "rgba(0,0,0,0.15)"
		labelMargin: 10, // in pixels
		axisMargin: 8, // in pixels
		borderWidth: 0, // in pixels
		minBorderMargin: 10, // in pixels, null means taken from points radius
		mouseActiveRadius: 5 // how far the mouse can be away to activate an item
	},
	tooltip: true,
	tooltipOpts: {
		content: '%y',
		defaultTheme: false
	}
};

/*
* DEFAULT CONFIG FOR TINYMCE
* Default TinyMCE config
*/
marketplace.tinyMCEDefault = { 
	height:300,
	content_css:["/wp-content/themes/kleo-child/assets/tinymce/custom_style.css","https://fonts.googleapis.com/css?family=Open+Sans"],
	plugins:['autolink link','paste'],
	menu: {},
	toolbar: 'undo redo | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
	setup: function (editor) {
		editor.on('keyup', function (e) {
			if(jQuery("textarea.wysiwyg").parents(".form-group").hasClass("has-error")){
				jQuery("textarea.wysiwyg").parents(".form-group").removeClass("has-error has-danger");
				jQuery("textarea.wysiwyg").parents(".form-group").find(".help-block").text("");
			}
		});
	}
}

/*
* CUSTOM FORM VALIDATION
* Validation for select2, uploads and tinyMCE
*/
marketplace.validateCustom = function(element){
	var uploads = element.find(".file-upload-container[required]");
	var select2 = element.find("select.select2[required]");
	var wysiwyg = element.find("textarea.wysiwyg[required]");

	var isValid = true;
	if(uploads.length > 0){
		uploads.each(function(){
			
			if(jQuery(this).find("input[type='hidden']").val() === ""){
				jQuery(this).parents(".form-group").addClass("has-error has-danger");
				jQuery(this).find(".help-block").text("Please upload an image.");
				isValid = false;
			}
		});
	}
	
	if(select2.length > 0){
		select2.each(function(){
			
			if(jQuery(this).val() == null){
				jQuery(this).parents(".form-group").addClass("has-error has-danger");
				jQuery(this).parents(".form-group").find(".help-block").text("Please choose at lease one item.");
				isValid = false;
			}
		});
	}	

	if(wysiwyg.length > 0){
		wysiwyg.each(function(){
			
			if(jQuery(this).val() === ""){
				jQuery(this).parents(".form-group").addClass("has-error has-danger");
				jQuery(this).parents(".form-group").find(".help-block").text("Please fill out this field.");
				isValid = false;
			}
		});
	}
	return isValid;
};

/*
* FILE UPLOADS
* Initializing the form for file uploads
*/
marketplace.setPreview = function(container, fileUrl){
	//get preview template
	var template = container.find("div.preview.template");
	var preview = template.clone().removeClass("template");

	marketplace.setProgress(preview.find(".progress .progress-bar"), 100);	
	preview.find(".img:first").html("<img src='" + fileUrl + "'>");
	
	preview.find(".img-remove").click(function(){
		marketplace.removeImage(container.find("input[type='hidden']"), preview, fileUrl);
		return false;
	});
	preview.find(".img-remove").show();

	//add preview to the container
	container.find(".previews").append(preview);
	preview.show();
};

marketplace.setProgress = function(container, progress){
	if(progress == 100){
		container.text("Complete");							
		container.addClass("progress-bar-success");
	}
	else {
		container.text(progress + "%");	
	}
	
	container.width(progress + "%");
	container.attr("aria-valuenow",progress);
};

marketplace.removeImage = function(input, preview, url){
	var value = input.val();
	value = value.replace(url + ",", "").replace("," + url, "").replace(url, "");
	input.val(value);
	
	preview.remove();		
};

marketplace.fileUpload = function(form){

	function addPreview(container, file, progress){
		//get preview template
		var template = container.find("div.preview.template");
		var preview = template.clone().removeClass("template");

		marketplace.setProgress(preview.find(".progress .progress-bar"), progress);	
		
		//add image to the preview
		var img = new Image;
		img.src = URL.createObjectURL(file);
		img.onload = function(){
			preview.find(".img:first").html("<img src='" + img.src + "'>");
		};

		//add preview to the container
		container.find(".previews").append(preview);
		preview.show();
	};

	var cropperObj;

	form.find(".file-upload-container").each(function(){
		var $this = jQuery(this);
		var imgWidth;
		var imgHeight;

		if($this.attr("data-width") != undefined){
			imgWidth = parseInt($this.attr("data-width"));
		}

		if($this.attr("data-height") != undefined){
			imgHeight = parseInt($this.attr("data-height"));
		}

		var type = $this.attr("data-type");
		var quantity = $this.attr("data-quantity");

		if(type == "image"){
			var uploader = $this.find("input[type='file']").imageUploader({
				"width": imgWidth,
				"height": imgHeight,
				"success": function(response, file){		    						
					var preview = $this.find("div.preview").filter(":not(.template)").filter(":not(.completed)");
					if(preview.length > 0){
						preview.addClass("completed success");

						marketplace.setProgress(preview.find(".progress .progress-bar"), 100);
						preview.find(".img-remove").click(function(){
							marketplace.removeImage($this.find("input[type='hidden']"), preview, response.fileUrl);
							return false;
						});
						preview.find(".img-remove").show();

						if(quantity == "multiple"){
							var value = $this.find("input[type='hidden']").val();

							if (value == ""){
								value = response.fileUrl;
							}
							else {
								value = value + "," + response.fileUrl;
							}

							$this.find("input[type='hidden']").val(value);
						}
						else {
							$this.find("input[type='hidden']").val(response.fileUrl);
						}
					}
					
					$this.parents(".form-group").removeClass("has-error has-danger");
					$this.parents(".form-group").find(".help-block").text("");
					
					marketplace.clearButtonWaiting($this.find("button"));
					marketplace.clearButtonWaiting(form.find("button[type='submit']"));
				},
				/** function executed while file is uploaded */
				"progress": function(file, e){
					$this.find(".help-block").empty();
					//calculate progress
					var progress = Math.ceil((e.loaded/e.total) * 100);

					//check if there is a preview for the file
					if(quantity != "multiple"){
						$this.find("div.preview").filter(":not(.template)").filter(".completed").remove();
					}

					var preview = $this.find("div.preview").filter(":not(.template)").filter(":not(.completed)");

					if(preview.length > 0){
						if(progress >= 100){
							progress=99;
						}

						marketplace.setProgress(preview.find(".progress .progress-bar"), progress);
					}
					else{
						//if there is no preview, create one
						addPreview($this, file, progress);
					}
					
					marketplace.buttonWaiting(form.find("button[type='submit']"), "<i class='fa fa-spinner fa-spin'></i> Uploading");
				},
				/** function executed when there is an error uploading the file */
				"fail": function(file, xhr){
					//if there is an error in connection
					if(xhr){
						//mark the preview as completed but failed
						var preview = $this.find("div.preview").filter(":not(.template)").filter(":not(.completed)");
						if(preview.length > 0){
							preview.addClass("completed failed");
						}
					}
					//if error is due to the file
					else {
						$this.find(".help-block").text("This file must be an image");
					}
					
					marketplace.clearButtonWaiting($this.find("button"));
					marketplace.clearButtonWaiting(form.find("button[type='submit']"));
				},
				/** function executed if image requires to be resized */
				"resize": function(file){
					marketplace.clearButtonWaiting($this.find("button"));
					marketplace.clearButtonWaiting(form.find("button[type='submit']"));
					
					//add image to the dialog modal
					var img = new Image();
					img.src = URL.createObjectURL(file);
					
					if(jQuery( "#modal-crop #modal-crop-container img").length > 0){
						jQuery( "#modal-crop #modal-crop-container img").cropper("destroy");
					}
					
					jQuery( "#modal-crop #modal-crop-container" ).html("<img src='" + img.src + "'>");
					var cropperObj = jQuery( "#modal-crop #modal-crop-container img");
					
					(function(cropperObj, imgWidth, imgHeight, uploader, file){
						jQuery( "#modal-crop #modal-crop-complete" ).off();
						jQuery( "#modal-crop #modal-crop-complete" ).click(function(){
							jQuery( "#modal-crop" ).modal("hide");
							
							cropperObj.cropper('getCroppedCanvas', {
								width: imgWidth,
								height: imgHeight
							}).toBlob(function (blob) {
								blob.name = file["name"];
								blob.type = file["type"];

								uploader.imageUploader("upload", blob);
							});

							return false;
						});
					})(cropperObj, imgWidth, imgHeight, uploader, file);

					cropperObj.cropper({
						aspectRatio: imgWidth / imgHeight,
						viewMode: 2,
						guides: false,
						cropBoxResizable: false,
						dragMode: 'move',
						zoomable: false,
						responsive: false,
						movable: false,
						toggleDragModeOnDblclick: false,
						minContainerWidth: 338,
						minContainerHeight: 338,
						built: function () {
							var imageData = cropperObj.cropper('getImageData');

							//set cropbox window
							cropperObj.cropper('setData', {
								width: imgWidth,
								height: imgHeight
							});

							if(imageData.naturalWidth > imgWidth && imageData.naturalHeight > imgHeight){
								//Image has too much width and height

								if((imageData.naturalWidth / imageData.naturalHeight) == (imgWidth / imgHeight)){
									//Image has same aspect ratio

									cropperObj.cropper('setCropBoxData', {
										width: imageData.naturalWidth,
										height: imageData.naturalHeight
									});

									cropperObj.cropper('getCroppedCanvas', {
										width: imgWidth,
										height: imgHeight
									}).toBlob(function (blob) {
										uploader.imageUploader("upload", new File([blob], file["name"], {type: file["type"]}));
									});
								}
								else if((imageData.naturalWidth / imageData.naturalHeight) > (imgWidth / imgHeight)) {
									//Image has different aspect ratio with more width
									var aspect = imgWidth / imgHeight;

									cropperObj.cropper('setCropBoxData', {
										width: imageData.naturalWidth,
										height: imageData.naturalWidth / aspect
									});

									jQuery( "#modal-crop" ).modal("show");
								}
								else if((imageData.naturalWidth / imageData.naturalHeight) < (imgWidth / imgHeight)) {
									//Image has different aspect ratio with more hight

									var aspect = imgWidth / imgHeight;

									cropperObj.cropper('setCropBoxData', {
										width: imageData.naturalWidth * aspect,
										height: imageData.naturalHeight
									});

									jQuery( "#modal-crop" ).modal("show");
								}
							}
							else {
								//Image has not enough width or height
								$this.parents(".form-group").addClass("has-error has-danger");
								$this.find(".help-block").text("Image too small, must be greater than "+imgWidth+"x"+imgHeight+".");
							}
						}
					});

					//return null to stop file upload
					return null;
				}
			});
		}

		//listener for drag and drop
		$this.find("button").click(function(){
			marketplace.buttonWaiting($this.find("button"), "<i class='fa fa-spinner fa-spin'></i> Uploading");
			$this.find("input[type='file']").click();
			return false;
		});

		function fileDragHover(e) {
			e.stopPropagation();
			e.preventDefault();
			if (e.type == "dragover") {
				$this.addClass('hover');
			} else {
				$this.removeClass('hover');
			}
		}

		function dropHandler(e) {
			// cancel event and hover styling
			fileDragHover(e);
			// fetch FileList object
			var files = e.target.files || e.originalEvent.dataTransfer.files;
			//process only the first file(the cropper tool is just supporting one file per time, it is required to create multiple croppers and dialogs to support multiple files)
			uploader.imageUploader("upload", files.item(0));
		}

		$this.on('dragover', fileDragHover);
		$this.on('dragleave', fileDragHover);
		$this.on('drop', dropHandler);
	});
};