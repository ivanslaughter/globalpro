export function alertLogin(type, message) {
    $("#alert-login").animate({
        height: '+=72px'
    }, 300);

    $(`<div class="alert ${type} d-flex align-items-center py-2 px-3 mt-4 lh-1 dismiss" role="alert">
      <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
        <use xlink:href="#info-fill" />
      </svg>
      <div>${message}</div>
      </div>`).hide().appendTo('#alert-login').fadeIn(1000);

    $(".alert").delay(3000).fadeOut(
        "normal",
        function () {
            $(this).remove();
        });

    $("#alert-login").delay(4000).animate({
        height: '-=72px'
    }, 300);
}

export function loadingButton(buttonId) {
    $(`#${buttonId}`).animate(300);

    $(`<span> </span><div class="spinner-border spinner-border-sm text-light" role="status"></div>`).hide().appendTo(`#${buttonId}`).fadeIn(1000);

    $(".spinner-border").delay(500).fadeOut(
        "normal",
        function () {
            $(this).remove();
        });

    $(`#${buttonId}`).delay(700).animate(300);
}

