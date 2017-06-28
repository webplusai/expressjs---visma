// transform cropper dataURI output to a Blob which Dropzone accepts
var dataURItoBlob = function (dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: 'image/jpeg'});
};

function initializeCropperDropzone( selector, config ) {
    var showCropper = true;

    var options = {
        url: "/api/upload",
        method: 'post',
        addRemoveLinks: true,
        clickable: false,
        maxFiles: config.maxFiles,
        minWidth: config.minWidth,
        minHeight: config.minHeight,
        init: function () {
            $(selector).append($(selector + ' .dz-preview').detach());
            this.on('success', function (file, response) {

                $(selector + " .upload-btn .fa-spinner").addClass("hidden");
                $(selector + " .upload-btn span").text("Select an Image");
                $(selector + " .upload-btn").prop("disabled", false);

                var $button = $('<a href="#" class="js-open-cropper-modal hidden" data-file-name="' + response + '">Crop & Upload</a>');
                setTimeout(function() {
                    if ( config.fileType == "icon") {
                        $("#" + config.fileType).val(response);
                        console.log($("#" + config.fileType).val());
                        $(selector + ' .dz-remove:last').click(function() {
                            $("#" + config.fileType).val('');
                            console.log($("#" + config.fileType).val());
                        });
                    } else {
                        if ( $("#" + config.fileType).val() == "" ) {
                            $("#" + config.fileType).val($("#" + config.fileType).val() + response);
                        } else {
                            $("#" + config.fileType).val($("#" + config.fileType).val() + "," + response);
                        }
                        console.log($("#" + config.fileType).val());
                        $(selector + ' .dz-remove:last').click(function() {
                            $("#" + config.fileType).val($("#" + config.fileType).val().replace(',' + response, ''));
                            $("#" + config.fileType).val($("#" + config.fileType).val().replace(response + ',', ''));
                            $("#" + config.fileType).val($("#" + config.fileType).val().replace(response, ''));
                            console.log($("#" + config.fileType).val());
                        });
                    }
                }, 0);
                
                $(file.previewElement).append($button);
                if (showCropper == true && config.bCropper == true) {
                    $button.trigger('click');
                    this.removeFile(file);
                    $(".modal.fade").remove();
                    showCropper = false;
                }

                $(selector + " .dz-upload:last").text("Complete");
                $(selector + " .dz-upload:last").addClass("completed");
            });

            this.on('drop', function (event) {
                
            });

            this.on('addedfile', function(file) {

                if ( config.fileType != "icon" || showCropper != true ) {
                    $(selector + " .upload-btn .fa-spinner").removeClass("hidden");
                    $(selector + " .upload-btn span").text("Uploading");
                    $(selector + " .upload-btn").prop("disabled", true);
                }

                if ( config.fileType == "icon" ) {
                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function(e) {

                        var image = new Image();
                        image.src = e.target.result;
                        image.onload = function() {

                            console.log(config);

                            if ( this.width < config.minWidth || this.height < config.minHeight ) {
                                myDropzone.removeFile(file);
                                var modalTemplate =
                                    '<div class="modal fade" tabindex="-1" role="dialog">' +
                                    '   <div class="modal-dialog modal-md" role="document">' +
                                    '       <div class="modal-content">' +
                                    '           <div class="modal-header">' +
                                    '               <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                                    '               <h4 class="modal-title">Image Size</h4>' +
                                    '           </div>' +
                                    '           <div class="modal-body">' +
                                    '               <p> Icon image should be at least ' + config.minWidth + 'x' + config.minHeight + ' pixels </p>' +
                                    '           </div>' +
                                    '           <div class="modal-footer">' +
                                    '               <button type="button" class="btn btn-default" data-dismiss="modal">OK</button>' +
                                    '           </div>' +
                                    '       </div>' +
                                    '   </div>' +
                                    '</div>';
                                $(modalTemplate).modal();
                            } else {
                                console.log("I am triggered");
                                var $button = $('<a href="#" class="js-open-cropper-modal hidden" data-file-name="' + e.target.result + '">Crop & Upload</a>');
                                $(file.previewElement).append($button);

                                if (showCropper == true) {
                                    $button.trigger('click');
                                    $(".modal.fade").remove();
                                    myDropzone.removeFile(file);
                                    $(selector + ' .dz-preview').remove();
                                    showCropper = false;
                                }
                            }
                        };
                    };
                }

                if ( config.bFile ) {
                    $(selector + " .dz-image *").remove();
                    $(selector + " .dz-preview .dz-image").append("<i class='fa fa-file'> </i>");
                }
            });

            this.on('maxfilesexceeded', function(file) {
                var files = this.files;

                if ( files.length > config.maxFiles ) {
                    for( i = 0; i < files.length; i++ ) { 
                        this.removeFile(files[i]);
                    } 
                    this.addFile(file);
                }
            });

            this.on('uploadprogress', function(file, progress) {
                if ( progress == 100 )
                    $(selector + ' .dz-upload:last').text('99%');
                else
                    $(selector + ' .dz-upload:last').text(progress.toFixed(2) + '%');
            });
        }
    }

    var myDropzone = new Dropzone(selector, options);

    $(selector + ' .dz-default').prepend("<button type='button' class='btn btn-default upload-btn'> <i class='fa fa-spinner hidden'> </i> <span> Select an Image </span> </button>");
    myDropzone.destroy();
    options.clickable = selector + ' .upload-btn';
    myDropzone = new Dropzone(selector, options);
    $(selector + ' .dz-default .upload-btn').click(function() {
        showCropper = true;
    });

    $(selector).on('click', '.js-open-cropper-modal', function (e) {
        e.preventDefault();
        var fileName = $(this).data('file-name');

        var modalTemplate =
            '<div class="modal fade" tabindex="-1" role="dialog">' +
            '   <div class="modal-dialog modal-lg" role="document">' +
            '       <div class="modal-content">' +
            '           <div class="modal-header">' +
            '               <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '               <h4 class="modal-title">Crop</h4>' +
            '           </div>' +
            '           <div class="modal-body">' +
            '               <div class="image-container">' +
            '                   <img id="img-' + config.fileType + '" src="' + fileName + '">' +
            '               </div>' +
            '           </div>' +
            '           <div class="modal-footer">' +
            '               <button type="button" class="btn btn-warning rotate-left"><span class="fa fa-rotate-left"></span></button>' +
            '               <button type="button" class="btn btn-warning rotate-right"><span class="fa fa-rotate-right"></span></button>' +
            '               <button type="button" class="btn btn-warning scale-x" data-value="-1"><span class="fa fa-arrows-h"></span></button>' +
            '               <button type="button" class="btn btn-warning scale-y" data-value="-1"><span class="fa fa-arrows-v"></span></button>' +
            '               <button type="button" class="btn btn-warning reset"><span class="fa fa-refresh"></span></button>' +
            '               <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '               <button type="button" class="btn btn-primary crop-upload">Crop & upload</button>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</div>';

        var $cropperModal = $(modalTemplate);

        $cropperModal.modal('show').on("shown.bs.modal", function () {
            var cropper = new Cropper(document.getElementById('img-' + config.fileType), {
                aspectRatio: 1,
                autoCropArea: 1,
                movable: false,
                cropBoxResizable: true,
                rotatable: true
            });
            var $this = $(this);
            $this
                .on('click', '.crop-upload', function () {
                    if( $(".cropper-crop-box").width() < 100 ) {
                        var modalTemplate =
                            '<div class="modal fade" tabindex="-1" role="dialog">' +
                            '   <div class="modal-dialog modal-md" role="document">' +
                            '       <div class="modal-content">' +
                            '           <div class="modal-header">' +
                            '               <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                            '               <h4 class="modal-title">Image Size</h4>' +
                            '           </div>' +
                            '           <div class="modal-body">' +
                            '               <p> Icon image should be at least ' + config.minWidth + 'x' + config.minHeight + ' pixels </p>' +
                            '           </div>' +
                            '           <div class="modal-footer">' +
                            '               <button type="button" class="btn btn-default" data-dismiss="modal">OK</button>' +
                            '           </div>' +
                            '       </div>' +
                            '   </div>' +
                            '</div>';
                        $(modalTemplate).modal();
                        return;
                    }
                    // get cropped image data
                    var blob = cropper.getCroppedCanvas().toDataURL();
                    // transform it to Blob object
                    var croppedFile = dataURItoBlob(blob);
                    croppedFile.name = fileName;

                    var files = myDropzone.getAcceptedFiles();
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        if (file.name === fileName) {
                            myDropzone.removeFile(file);
                        }
                    }
                    myDropzone.addFile(croppedFile);
                    myDropzone.processQueue();
                    $this.modal('hide');
                })
                .on('click', '.rotate-right', function () {
                    cropper.rotate(90);
                })
                .on('click', '.rotate-left', function () {
                    cropper.rotate(-90);
                })
                .on('click', '.reset', function () {
                    cropper.reset();
                })
                .on('click', '.scale-x', function () {
                    var $this = $(this);
                    cropper.scaleX($this.data('value'));
                    $this.data('value', -$this.data('value'));
                })
                .on('click', '.scale-y', function () {
                    var $this = $(this);
                    cropper.scaleY($this.data('value'));
                    $this.data('value', -$this.data('value'));
                });
        });
    });
}