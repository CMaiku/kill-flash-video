if (typeof window.kill_flash_video_overrides !== 'object')
  window.kill_flash_video_overrides = {}

// Use a nice variable name
var overrides = window.kill_flash_video_overrides

/*
 * Overrides follow this format:

overrides["www.hostname-example.com"] = function(node, flashvars) {
  // Fetch video-url and optionally image-url here
  return ["video-url", "image-url"]
}

 * "node" is the DOM node of the flash object.
 * "flashvars" is the gathered flashvar parameter translated into
 *   an object for convenience.
 * Returning just the ["video-url"] is also valid.
 */
