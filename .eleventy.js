const path = require('path')
const pluginRss = require("@11ty/eleventy-plugin-rss"); // needed for absoluteUrl SEO feature
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const EleventyVitePlugin = require("@11ty/eleventy-plugin-vite");
const Image = require("@11ty/eleventy-img");
const yaml = require("js-yaml"); // Because yaml is nicer than json for editors
const { DateTime } = require("luxon");
require('dotenv').config();

const baseUrl = process.env.BASE_URL || "http://localhost:8080";
console.log('baseUrl is set to ...', baseUrl);

const globalSiteData = {
  title: "🛤️",
  description: "34N0's developer blog featuring Software, self-hosting & security research. I write this blog as my personal knowledge database.",
  locale: 'en',
  baseUrl: baseUrl,
}

module.exports = function(eleventyConfig) {

  /* --- GLOBAL DATA --- */
  
  eleventyConfig.addGlobalData("site", globalSiteData);

  /* --- YAML SUPPORT --- */
  
  eleventyConfig.addDataExtension("yaml", contents => yaml.load(contents));
  eleventyConfig.addDataExtension("yml", contents => yaml.load(contents));

  /* --- PASSTHROUGHS --- */

  eleventyConfig.addPassthroughCopy('src/assets/css')
	eleventyConfig.addPassthroughCopy('src/assets/js')
	eleventyConfig.addPassthroughCopy('src/assets/fonts')
	eleventyConfig.addPassthroughCopy('src/assets/images')
	eleventyConfig.addPassthroughCopy('src/assets/keys')
	eleventyConfig.addPassthroughCopy('public')


  /* --- PLUGINS --- */

  eleventyConfig.addPlugin(pluginRss); // just includes absolute url helper function
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(EleventyVitePlugin, {});

  /* --- SHORTCODES --- */

  // Image shortcode config
  let defaultSizesConfig = "(min-width: 1200px) 1400px, 100vw"; // above 1200px use a 1400px image at least, below just use 100vw sized image

  eleventyConfig.addShortcode("image", async function(src, alt, sizes=defaultSizesConfig) {
		console.log(`Generating image(s) from:  ${src}`)
    let metadata = await Image(src, {
			widths: [800, 1500],
			formats: ["webp", "jpeg"],
      urlPath: "/images/",
			outputDir: "./_site/images/",
			filenameFormat: function (id, src, width, format, options) {
				const extension = path.extname(src)
				const name = path.basename(src, extension)
				return `${name}-${width}w.${format}`
			}
		});

		let imageAttributes = {
			alt,
			sizes,
			loading: "lazy",
			decoding: "async",
		};

		return Image.generateHTML(metadata, imageAttributes);
	});

  // Output year for copyright notices
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);


  /* --- FILTERS --- */

  // Custom Random Helper Filter (useful for ID attributes)
  eleventyConfig.addFilter("generateRandomIdString", function (prefix) {
    return prefix + "-" + Math.floor(Math.random() * 1000000);
  });


  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });


  /* --- BASE CONFIG --- */

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "includes", // this path is releative to input-path (src/)
      layouts: "layouts", // this path is releative to input-path (src/)
      data: "data", // this path is releative to input-path (src/)
    },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};