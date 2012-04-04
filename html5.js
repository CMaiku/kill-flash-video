if (typeof window.kill_flash_video_overrides !== "object")
  window.kill_flash_video_overrides = {}

// Use a nice variable name
var overrides = window.kill_flash_video_overrides

function walkObject(obj, callback, recursive)
{
  var recursive = recursive || true
  var ret = []

  for (var key in obj)
  {
    var val = obj[key]
    var retval = callback(obj, key, val)

    // Don't bother storing undefined values
    if (retval !== undefined)
      ret.push(retval)

    if (val instanceof Object)
    {
      if (recursive)
        ret = ret.concat(walkObject(val, callback, true))
    }
  }

  return ret
}

function urlHasExtension(url, extension)
{
  return (url.search(new RegExp("\." + extension + "(\\?.*)?", "i")) >= 0)
}

function urlGetExtension(url)
{
  var regex = new RegExp(/\.(\w+)(\?|$)/)
  match = regex.exec(url)
  return (match && match[1]) || ""
}

function getFirstImage(urls)
{
  for (var i=0; i<urls.length; i++)
  {
    var ext = urlGetExtension(urls[i])
    console.log("Found extension: ", ext, " in: ", urls[i])
    ext = ext.toLowerCase()
    if (ext == "jpg" || ext == "png" || ext == "gif")
      return urls[i]
  }

  return ""
}

function canPlayVideoCodec(codec_ext)
{
  var vid = document.createElement("video")

  if (vid.canPlayType)
  {
    // Some browsers don't report they support flv even when they do
    if (codec_ext == "flv")
      return "maybe"

    return vid.canPlayType("video/" + codec_ext)
  } else {
    return ""
  }
}

function getFirstVideo(urls)
{
  for (var i=0; i<urls.length; i++)
  {
    var ext = urlGetExtension(urls[i])
    console.log("Found extension: " + ext + " in: " + urls[i])
    ext = ext.toLowerCase()
    can_play = canPlayVideoCodec(ext)
    console.log("Can play '" + ext + "'? " + can_play || "no")
    if (can_play)
      return urls[i]
  }

  return ""
}

function detectInterestingValues(obj, key, value)
{
  if (key.toLowerCase().indexOf("url") >= 0)
  {
    if (value.length == 0)
    {
      // Skip empty urls
    } else if (urlHasExtension(value, "swf")) {
      // Skip .swf files
    } else {
      console.log("Found url:", key, ": ", value)
      return value
    }
  } else if (typeof(value) == "string" &&
      value.toLowerCase().indexOf("http") == 0) {
    console.log("Found http:", key, ": ", value)
    return value
  }
}

function collectInterestingValues(vars)
{
  var ret = walkObject(vars, detectInterestingValues)
  console.log("urls: ", ret)
  return ret
}

function parseFlashVars(flashvars)
{
  var params = flashvars.split("&")
  var ret={}

  for (var i=0; i<params.length; i++)
  {
    var idx = params[i].indexOf("=")
    var key = params[i].slice(0, idx)
    var val = unescape(params[i].slice(idx + 1))

    if (val[0] == '{')
    {
      val = JSON.parse(val)
    }

    ret[key] = val
  }

  return ret
}

function getFlashVars(obj)
{
  for (var i=0; i<obj.childNodes.length; i++)
  {
    param = obj.childNodes[i]

    if (param.tagName == "PARAM" &&
        param.getAttribute("name") == "flashvars")
      return param.getAttribute("value")
  }

  return obj.getAttribute("flashvars")
}

function replaceFlash(node)
{
  var flashvars = getFlashVars(node)

  if (!flashvars && !overrides[window.location.host])
    return

  if (flashvars)
    var vars = parseFlashVars(flashvars)
  else
    var vars = {}

  if (overrides[window.location.host])
  {
    var override = overrides[window.location.host](node, vars)
    var video = override[0]
    if (override.length > 1)
    {
      var image = override[1]
    } else {
      var urls = collectInterestingValues(vars)
      var image = getFirstImage(urls)
    }
  } else {
    var urls = collectInterestingValues(vars)
    var image = getFirstImage(urls)
    var video = getFirstVideo(urls)
  }

  console.log(image)
  console.log(video)

  if (video.length == 0)
  {
    console.log("Couldn't find video url, not replacing flash")
    return
  }

  var newVideo = document.createElement("video")
  newVideo.setAttribute("width", node.width)
  newVideo.setAttribute("height", node.height)
  newVideo.setAttribute("controls", "controls")
  if (image.length > 0)
    newVideo.setAttribute("poster", image)
  newVideo.setAttribute("src", video)
  node.parentNode.replaceChild(newVideo, node)
  console.log(newVideo)
}

function replaceObjects()
{
  var objs = document.getElementsByTagName("OBJECT")
  console.log("Found " + objs.length + " objects")

  for (var i=0; i<objs.length; i++)
  {
    var obj = objs[i]
    console.log(obj)
    replaceFlash(obj)
  }
}

function replaceEmbeds()
{
  var objs = document.getElementsByTagName("EMBED")
  console.log("Found " + objs.length + " embeds")

  for (var i=0; i<objs.length; i++)
  {
    var obj = objs[i]
    console.log(obj)
    if (obj.type == "application/x-shockwave-flash")
      replaceFlash(obj)
  }
}

replaceObjects()
replaceEmbeds()

document.addEventListener("DOMNodeInserted", function(event) {
  var element = event.target

  if (element.tagName == "OBJECT" || (element.tagName == "EMBED" &&
      element.type == "application/x-shockwave-flash"))
  {
    console.log("Object inserted: ", element)
    replaceFlash(element)
  }
}, false)

