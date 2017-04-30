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
  const pchar = UNRESERVED + percent_encoded + sub_delims + ":" + "@";
  const path = "/" + pchar;
  const fragment = pchar + "/" + "?";
  const query = pchar + "/" + "?";

  module.exports = {
    host_boost: host.split( '' ).push( "--", "::" ),
    path_boost: path.split( '' ).push( "..", "/../", "/./", "%20", "%%" ),
    query_boost: query.split( '' ).push( "&=", "%20", "%%" ),
    fragment_boost: fragment.split( '' ).push( '#' )
  }
}
