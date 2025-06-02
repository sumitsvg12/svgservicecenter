module.exports = {
    ensureAdmin: (req, res, next) => {
      console.log("Checking for admin session...");
      if (req.session.admin) return next();

      return res.redirect('/admin/login');
    },
  
    ensureUser: (req, res, next) => {
      console.log("Checking for user session...");
      if (req.session.userId) return next();
      console.log("User session not found, redirecting to login page");
      return res.redirect('/User/login');
    }
  };