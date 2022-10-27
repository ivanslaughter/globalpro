

export function adminUser(user){
  
    let userDetail = '';

    userDetail = `<h5>User Detail</h5>`;
    userDetail += `<form id="user-detail-form">`;
    userDetail += `<div class="mb-2">
            <input type="text" class="form-control" id="user-detail-name" placeholder="Nama Lengkap" value="${user.nama}">
        </div>
        <div class="mb-2">
            <input type="text" class="form-control" id="user-detail-email" placeholder="Email" value="${user.email}" disabled>
        </div>`;
    userDetail += `</form>`;

    document.getElementById('admin-form').innerHTML = userDetail;
}