exports.getIndex = (req, res, next) => {
  res.render("shop/home", {
    pageTitle: "Nodejs",
  });
};

