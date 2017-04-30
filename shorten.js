"use strict";
{
  const fs = require('fs');
  const { host_codes, path_codes, query_codes, fragment_codes } = JSON.parse(
    '{}'
    // fs.readFileSync( 'codes.json', {encoding:'utf8'} )
  );
  const { original, other_common, rest } = JSON.parse(
    '{}'
    // fs.readFileSync( 'tlds.json', {encoding:'utf8'} )
  );
  const state = {
    url: process.argv[2],
    code: '10' // format version 1 ( version is the count of 1s before the first 0 )
  };

  function parse( state ) {
    const { url } = state;
    if ( url.indexOf('://') == -1 ) {
      throw new TypeError('Only accept authority URLs with <scheme>://');
    }
    const [ scheme, schemeless ] = url.split( /:\/\/(.+)/ );
    const [ hostport, hostless ] = schemeless.split(/\/(.+)/ );
    const [ host, port ] = hostport.split(/:(.+)/);
    const [ path, pathless ] = hostless.split(/\?(.+)/);
    const [ query, fragment ] = pathless.split(/#(.+)/);

    state.presence = [
      `${ port ? 1:0}`,
      `${ path ? 1:0}`,
      `${ query ? 1:0}`,
      `${ fragment ? 1:0}`
    ].join('');
    state.code += state.presence;
    state.url = {
      scheme, host, port, path, query, fragment
    };
  }

  function code_scheme( state ) {
    if ( state.url.scheme == 'https' ) {
      state.code += '1';
    } else if ( state.url.scheme == 'http://' ) {
      state.code += '0';
    } 
  }

  function code_tld( state ) {

  }

  function test() {
    parse(state);
    code_scheme(state);
    console.log(state);
  }

  test()

}
