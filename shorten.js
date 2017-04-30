"use strict";
{
  const fs = require('fs');
  const host_codes = fs.readFileSync( 'host_codes.json', {encoding:'utf8'} );
  const path_codes = fs.readFileSync( 'path_codes.json', {encoding:'utf8'} );
  const query_codes = fs.readFileSync( 'query_codes.json', {encoding:'utf8'} );
  const fragment_codes = fs.readFileSync( 'fragment_codes.json', {encoding:'utf8'} );

  const tld_codes = JSON.parse(
    fs.readFileSync( 'tld_codes.json', {encoding:'utf8'} )
  );
  const tld_search_order = ["original", "other_common", "rest"];
  const state = {
    url: process.argv[2],
    code: '10' // format version 1 ( version is the count of 1s before the first 0 )
  };

  function shrink( word, codes ) {
    let encoding = ''
    let code = '';
    for( const char of word ) {
      if ( code+char in codes ) {
        code = code+char;
      } else {
        console.log( code, codes[code] );
        encoding += codes[code];
        code = char;
      }
    }
    if ( code.length ) {
      console.log( code, codes[code] );
      encoding += codes[code];
    }
    return encoding;
  }

  function tostring( bits ) {
    const bytes = [];
    bits = bits.split('');
    while( bits.length ) {
      bytes.push( bits.splice(0,8).join('') );
    }
    console.log( bytes );
    bytes.forEach( (s,i) => {
      bytes[i] = parseInt(s,2);
    });
    console.log( bytes );
    bytes.forEach( (b,i) => {
      bytes[i] = String.fromCharCode( b );
    });
    console.log( btoa( bytes.join('' ) ) );
    return btoa( bytes.join('') );
  }

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
    const group_codes = {
      original: '0',
      other_common: '10',
      rest: '11'
    };
    const parts = state.url.host.split( '.' )
    console.log( parts );
    const match = {};
    search: for ( const group_name of tld_search_order ) {
      const group = tld_codes[group_name];
      for ( let i = 0; i < parts.length; i++ ) {
        const test = '.' + parts.slice( i ).join( '.' );
        console.log( group_name, parts, i, test );
        if ( test in group ) {
          match.tld = test; 
          match.code = group[test];
          match.domain = state.url.host.slice(0, -test.length);
          match.groupcode = group_codes[group_name];
          break search;
        }
      }
    }
    state.tld = match;
    state.domain = match.domain;
    state.code += match.groupcode + match.code;
  }

  function test() {
    parse(state);
    code_scheme(state);
    code_tld( state );
    console.log(state);
  }

  test()

}
