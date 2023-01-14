const async = require("async");
const { body, validationResult } = require("express-validator");

const Book = require("../models/book");
const BookInstance = require("../models/bookinstance");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .sort([["book", "ascending"]])
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];

// Display Book Instance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        res.redirect("/catalog/bookinstances");
      }
      // Successful, so render.
      res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        bookinstance,
      });
    });
};

// Handle Book Instance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.body.bookinstanceid).exec(callback);
      },
      bookinstances_books(callback) {
        Book.find({ bookinstance: req.body.bookinstanceid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      // Delete object and redirect to the list of bookinstances.
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) {
          return next(err);
        }
        // Success - go to bookinstance list
        res.redirect("/catalog/bookinstances");
      });
    }
  );
};

// Display Book Instance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  // Get bookinstance and books for form.
  async.parallel(
    {
      bookinstance(callback) {
        BookInstance.findById(req.params.id).populate("book").exec(callback);
      },
      books(callback) {
        Book.find(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        // No results.
        const err = new Error("Book Instance not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      // // Mark our selected genres as checked.
      // for (const genre of results.genres) {
      //   for (const bookGenre of results.book.genre) {
      //     if (genre._id.toString() === bookGenre._id.toString()) {
      //       genre.checked = "true";
      //     }
      //   }
      // }
      res.render("bookinstance_form", {
        title: "Update Book Instance",
        book_list: results.books,
        bookinstance: results.bookinstance,
        selected_book: results.bookinstance.book,
        selected_status: results.bookinstance.status,
      });
    }
  );
};

// Handle book instance update on POST.
exports.bookinstance_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and old id.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all books for form.
      async.parallel(
        {
          bookinstance(callback) {
            BookInstance.findById(req.params.id)
              .populate("book")
              .exec(callback);
          },
          books(callback) {
            Book.find(callback);
          },
        },
        (err, results) => {
          if (err) {
            return next(err);
          }

          res.render("bookinstance_form", {
            title: "Update Book Instance",
            book_list: results.books,
            selected_book: bookinstance.book,
            selected_status: bookinstance.status,
            bookinstance,
            errors: errors.array(),
          });
        }
      );
      return;
    }

    // Data from form is valid. Update the record.
    BookInstance.findByIdAndUpdate(
      req.params.id,
      bookinstance,
      {},
      (err, thebookinstance) => {
        if (err) {
          return next(err);
        }

        // Successful: redirect to bookinstance detail page.
        res.redirect(thebookinstance.url);
      }
    );
  },
];
