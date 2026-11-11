/* Everything on the Books, Events and Photos pages comes from this file.
   Replace the sample entries with your own, then delete `sample: true`. */
window.SITE = {
  sample: true,

  // fav: true marks a favourite. note is one line on what you took from it.
  books: [
    { title: "Book title one",   author: "Author name", note: "One line on what you took from it.", fav: true },
    { title: "Book title two",   author: "Author name", note: "One line on what you took from it." },
    { title: "Book title three", author: "Author name", note: "One line on what you took from it." },
    { title: "Book title four",  author: "Author name", note: "One line on what you took from it." }
  ],

  // photos: paths to image files, e.g. "photos/devfest-1.jpg". post: optional LinkedIn link.
  events: [
    { name: "Event name", venue: "Venue, Bengaluru", date: "Month 2026", note: "One or two lines on what you saw or learned.", post: "", photos: ["", "", ""] },
    { name: "Event name", venue: "Venue, Bengaluru", date: "Month 2025", note: "One or two lines on what you saw or learned.", post: "", photos: ["", "", ""] }
  ],

  // tag groups photos under a filter button, e.g. "Travel", "Cycling", "Events".
  photos: [
    { src: "", caption: "Caption", tag: "Travel" },
    { src: "", caption: "Caption", tag: "Travel" },
    { src: "", caption: "Caption", tag: "Cycling" },
    { src: "", caption: "Caption", tag: "Events" },
    { src: "", caption: "Caption", tag: "Travel" },
    { src: "", caption: "Caption", tag: "Cycling" }
  ]
};
