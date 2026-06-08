/**
 * Pipeline progress message constants.
 * Used by inngest-functions.js for human-readable status updates.
 *
 * NOTE: inngest-functions.js currently has these strings hardcoded inline.
 * To activate these constants, update the startProgress/endProgress calls
 * in inngest-functions.js to import and use these values.
 */

export const PIPELINE_MESSAGES = {
  TREND_SCOUT: {
    start: 'Mencari trending AI/tech topics terkini…',
    done:  'Trending topics found',
  },
  TOPIC_SELECTOR: {
    start: 'Preparing 6 topic options for editor…',
    done:  (count) => `${count} topic options ready`,
  },
  DEEP_RESEARCHER: {
    start: 'Menjalankan penyelidikan mendalam…',
    done:  'Research complete',
  },
  ARTICLE_WRITER: {
    start: 'Menulis artikel penuh…',
    done:  'Article draft complete',
  },
  SEO_METADATA: {
    start: 'Generating SEO metadata…',
    done:  'SEO metadata ready',
  },
  IMAGE_BRIEF: {
    start: 'Creating image briefs…',
    done:  'Image briefs ready',
  },
  QUALITY_CHECKER: {
    start: 'Checking article quality…',
    done:  (score) => `Quality check complete — score: ${score}`,
  },
  REVISION: {
    start: 'Revising article…',
    done:  'Revision complete',
  },
  SAVE_ARTICLE: {
    start: 'Saving article…',
    done:  'Article saved',
  },
}
