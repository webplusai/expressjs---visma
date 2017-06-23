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

function initializeCropperDropzone( selector, imgId ) {
    var showCropper = true;

    var options = {
        url: "/upload",
        method: 'post',
        addRemoveLinks: true,
        parallelUploads: 10,
        clickable: false,
        uploadMultiple: false,
        maxFiles: 10,
        init: function () {
            this.on('success', function (file,response) {
                var $button = $('<a href="#" class="js-open-cropper-modal hidden" data-file-name="' + response + '">Crop & Upload</a>');
                setTimeout(function() {
                    $('.dz-remove').text('');
                    $('.dz-remove').append('<i class="fa fa-trash"> </i>');
                }, 0);
                
                $(file.previewElement).append($button);
                if (showCropper == true) {
                    $button.trigger('click');
                    myDropzone.removeFile(file);
                    $(".modal.fade").remove();
                    showCropper = false;
                } else {
                    setTimeout(function() {
                        $('.dz-preview:last-child .dz-filename span').text(file.name.substring(14));
                    });
                }
            });
        }
    }

    var myDropzone = new Dropzone(selector, options);

    $(selector + ' .dz-default').prepend("<input type='button' class='btn btn-default upload-btn' value='Select an Image'>");
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
            '                   <img id="img-' + imgId + '" src="/uploads/' + fileName + '">' +
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
            var cropper = new Cropper(document.getElementById('img-' + imgId), {
                autoCropArea: 1,
                movable: false,
                cropBoxResizable: true,
                rotatable: true
            });
            var $this = $(this);
            $this
                .on('click', '.crop-upload', function () {
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