let prevDivId = '';

export function showAlert(divId, type, message) {
    if (prevDivId !== divId) {
        prevDivId = divId;
        $(`#${divId}`).animate({
            height: '+=72px'
        }, 300);
    
        $(`<div class="alert ${type} d-flex align-items-center py-2 px-3 mt-4 lh-1 dismiss" role="alert">
          <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
            <use xlink:href="#info-fill" />
          </svg>
          <div>${message}</div>
          </div>`).hide().appendTo(`#${divId}`).fadeIn(1000);
    
        $(".alert").delay(3000).fadeOut(
            "normal",
            function () {
                $(this).remove();
                prevDivId = '';
            });
    
        $(`#${divId}`).delay(4000).animate({
            height: '-=72px'
        }, 300);
    }
}


let prevButtonId = '';

export function startLoadingButton(buttonId) {
    if (prevButtonId !== buttonId) {
        $(`#${buttonId}`).animate(300);
        $(`<span> </span><div class="spinner-border spinner-border-sm text-light" role="status"></div>`).hide().appendTo(`#${buttonId}`).fadeIn(1000);
        prevButtonId = buttonId;
    }
}

export function stopLoadingButton(buttonId) {
    $(".spinner-border").fadeOut(
        "normal",
        function () {
            $(this).remove();
            prevButtonId = '';
        });
    $(`#${buttonId}`).animate(300);
}

