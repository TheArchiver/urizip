"use strict";
{
  const alpha = "abcdefghijklmnopqrstuvwxyz";
  const ALPHA = alpha + alpha.toUpperCase();
  const DIGIT = "0123456789";
  const HEXDIG = "ABCDEFabcdef0123456789";
  const UNRESERVED = ALPHA + DIGIT + "-_.~";
  const unreserved = alpha + DIGIT + "-_.~";
  const gen_delims = ":/?#[]@";
  const sub_delims = "!$&'()*+,;=";
  const percent_encoded = "%" + HEXDIG;
  const userinfo = UNRESERVED + percent_encoded + sub_delims + ":";
  const reg_name = unreserved + percent_encoded + sub_delims;
  const ip_v4_address = DIGIT + ".";
  const ip_v6_address = HEXDIG + "::" + ip_v4_address;
  const ip_vfuture = "v" + HEXDIG + "." + unreserved + sub_delims + ":";
  const ip_literal = "[]" + ip_v6_address + ip_vfuture;
  const host = ip_literal + ip_v4_address + reg_name;
  const pchar = UNRESERVED + percent_encoded + sub_delims + ":" + "e";
  const path = "/" + pchar;
  const fragment = pchar + "/" + "?";
  const percent_encoded_commons = [ "%20", "%25", "%26", "%3D", "%3d" ]; 
  const query = pchar + "/" + "?";

  const host_boost = host.split('');
  host_boost.push("--", "::" );
  const path_boost = path.split('');
  path_boost.push( "..", "/../", "/./", ...percent_encoded_commons );
  const query_boost = query.split('');
  query_boost.push( ...percent_encoded_commons );
  const fragment_boost = fragment.split('');

  module.exports = {
    host_boost, path_boost, query_boost, fragment_boost
  }
}
