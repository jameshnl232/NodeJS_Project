const deleteProduct = async function (btn) {
  try {
    const prodId = btn.parentNode.querySelector("[name=productId]").value;
    const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

    const response = await fetch("/admin/delete-product/" + prodId, {
      method: "DELETE",
      headers: {
        "csrf-token": csrf,
      },
    });
    const data = await response.json();
    console.log(data);
    // Find the closest parent element with the class 'col-lg-4' (the card container)
    const card = btn.closest(".product-card");

    // Remove the card element from the DOM
    card.remove();
  } catch (err) {
    console.log(err);
  }
};
