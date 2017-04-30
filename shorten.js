"use strict";
{
  const btoa = require('btoa');
  const fs = require('fs');
  const host_codes = JSON.parse( fs.readFileSync( 'host_codes.json', {encoding:'utf8'} ) );
  const path_codes = JSON.parse( fs.readFileSync( 'path_codes.json', {encoding:'utf8'} ) );
  const query_codes = JSON.parse( fs.readFileSync( 'query_codes.json', {encoding:'utf8'} ) );
  const fragment_codes = JSON.parse( fs.readFileSync( 'fragment_codes.json', {encoding:'utf8'} ) );
  const part_codes = {
    host_codes, path_codes, query_codes, fragment_codes
  };

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
        //console.log( code, codes[code] );
        encoding += codes[code];
        code = char;
      }
    }
    if ( code.length ) {
      //console.log( code, codes[code] );
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
    console.log(scheme,schemeless);
    const [ hostport, hostless ] = schemeless.split(/\/(.+)/ );
    console.log(hostport,hostless)
    const [ host, port ] = hostport.split(/:(.+)/);
    console.log(host,port)
    const [ path, pathless ] = hostless.split(/\?(.+)/);
    console.log(path,pathless)
    let query, fragment;
    if ( !!pathless ) {
      ([ query, fragment ] = pathless.split(/#(.+)/));
    }

    state.presencecode = [
      `${ port ? 1:0}`,
      `${ path ? 1:0}`,
      `${ query ? 1:0}`,
      `${ fragment ? 1:0}`
    ].join('');
    state.code += state.presencecode;
    state.url = {
      scheme, host, port, path, query, fragment
    };
    state.wordparts = {
      path, query, fragment
    }
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
    //console.log( parts );
    const match = {};
    search: for ( const group_name of tld_search_order ) {
      const group = tld_codes[group_name];
      for ( let i = 0; i < parts.length; i++ ) {
        const test = '.' + parts.slice( i ).join( '.' );
        //console.log( group_name, parts, i, test );
        if ( test in group ) {
          match.tld = test; 
          match.code = group[test];
          match.domain = state.url.host.slice(0, -test.length);
          match.groupcode = group_codes[group_name];
          break search;
        }
      }
    }
    state.tld = (({tld, groupcode, code}) => ({tld, groupcode, code}))(match);
    state.wordparts.host = match.domain;
    state.code += match.groupcode + match.code;
  }

  function code_part( state, partname ) {
    const part = state.wordparts[partname];
    if ( !!part ) {
      state[partname+'code'] = shrink( part, part_codes[partname+'_codes'] );
      state.code += state[partname+'code'];
    }
  }

  function code_parts( state ) {
    const partnames = ["host", "path", "query", "fragment"];
    for ( const partname of partnames ) {
      code_part( state, partname );
    }
  }

  function stringify( state ) {
    state.string = tostring( state.code );
  }

  function test() {
    parse(state);
    code_scheme(state);
    code_tld( state );
    code_parts( state );
    stringify( state );
    console.log(state);
  }

  test()
}
