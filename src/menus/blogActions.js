// Blog actions shared by the user and admin menus.
const blogService = require('../services/blogService');
const { askRequired, askId, chooseOption, printSection } = require('../utils/prompt');
const { printBlogs } = require('../utils/display');

/**
 * Search Blog by ID/Title.
 * @param {{ userId?: number }} scope  pass userId to search only that user's blogs
 */
async function searchBlogFlow({ userId } = {}) {
  const by = await chooseOption('Search Blog', ['Search by Blog ID', 'Search by Blog Title'], {
    allowBack: true,
  });

  let results;
  if (by === 1) {
    printSection('Search by Blog ID');
    const id = await askId('Enter blog ID: ');
    results = await blogService.searchBlogs({ id, userId });
  } else {
    printSection('Search by Blog Title');
    const title = await askRequired('Enter blog title (full or part of it): ');
    results = await blogService.searchBlogs({ title, userId });
  }

  if (results.length === 0) {
    console.log('\n  No blogs are found');
    return;
  }
  console.log(`\n  ${results.length} blog(s) found:`);
  printBlogs(results);
}

module.exports = { searchBlogFlow };
