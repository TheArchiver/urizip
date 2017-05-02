"use strict";
{
  let { atob, btoa } = window;
  if ( !atob && !btoa ) {
    try {
     ({ atob, btoa } = require('./browser_api.js'));
    } catch(e) {
      console.warn(e);
    }
  }

  const tld_tree = require('./tld_tree.js');
  const host_tree = require('./host_tree.js');
  const path_tree = require('./path_tree.js');
  const query_tree = require('./query_tree.js');
  const fragment_tree = require('./fragment_tree.js');
  const host_codes = require('./host_codes.js');
  const path_codes = require('./path_codes.js');
  const query_codes = require('./query_codes.js');
  const fragment_codes = require('./fragment_codes.js');
  const tld_codes = require('./tld_codes.js');

  const part_codes = {
    host_codes, path_codes, query_codes, fragment_codes
  };

  const tld_search_order = ["original", "other_common", "rest"];

  if ( ! process.browser ) {
    cli();
  } else {
    window.urizip = { encode, decode };
  }
  

  function shrink( word, codes ) {
    let encoding = ''
    let code = '';
    for( let i = 0; i < word.length; i++ ) {
      const char = word[i];
      if ( code+char in codes ) {
        code = code+char;
      } else {
        let longest = code;
        const MAX = Math.min( 6, word.length - i );
        for( let j = 1; j < MAX;j++ ) {
          const idx = j+i;
          if ( idx >= word.length ) {
            break;
          }
          if ( code+char+word.slice(i+1,idx+1) in codes ) {
            longest = code+char+word.slice(i+1,idx+1);
            i = idx+1;
          }
        }
        //console.log( longest, codes[code] );
        encoding += codes[longest];
        code = word[i] || '';
      }
    }
    if ( code.length ) {
      //console.log( code, codes[code] );
      encoding += codes[code];
    }
    return encoding;
  }

  function random_choice( s ) {
    const random_index = Math.floor( Math.random() * s.length );
    return s[random_index];
  }

  function gen_divider( s, dividers = [] ) {
    const disallowed = "[]#";
    // if we need to use this we choose a 2 character symbol as divider
    // or enlarge to length 3 if none found
    const backup_alphabet = "abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXY" + disallowed;
    if ( ! dividers.length ) {
      for( const div of disallowed ) {
        if ( s.includes( div ) ) {
          continue;
        }
        return div;
      }
    }
    let found = false;
    for ( const candidate of disallowed ) {
      if ( dividers.includes( candidate ) || s.includes( candidate ) ) {
        continue;
      }
      return candidate;
    }
    let count = 1000;
    while( count-- ) {
      const div = random_choice( backup_alphabet ) + random_choice( backup_alphabet );
      if ( dividers.includes( div ) || s.includes( div ) ) {
        continue;
      }
      return div;
    }
    count = 1000;
    while( count-- ) {
      const div = random_choice( backup_alphabet ) + random_choice( backup_alphabet ) + random_choice( backup_alphabet );
      if ( dividers.includes( div ) || s.includes( div ) ) {
        continue;
      }
      return div;
    }
    throw new TypeError( `Impossible to find a divider for string ${s} that is not present in string.` )
  }

  function gen_dividers( s, array, numbers, part ) {
    const dividers = [ gen_divider( s ) ];  
    if ( array ) {
      dividers[1] = gen_divider( s, dividers );
    }
    if ( numbers ) {
      dividers[2] = gen_divider( s, dividers );
    }
    if ( part ) {
      dividers[3] = gen_divider( s, dividers );
    }
    return dividers;
  }

  function tostring( state ) {
    let bits = state.code.split('');
    const bytes = [];
    const  last_octet_length = (( 3 + bits.length ) % 8).toString(2).split('');
    //console.log( "LAL", last_octet_length );
    while( last_octet_length.length < 3 ) {
      last_octet_length.unshift('0');
    }
    //console.log( "LAL", last_octet_length );
    const temp = state.code.split('');
    temp.splice(6, 0, ...last_octet_length );
    state.code = temp.join('');
    bits = state.code.split('');
    while( bits.length ) {
      const octet = bits.splice(0,8).join('');
      bytes.push( octet );
    }
    bytes.forEach( (s,i) => {
      bytes[i] = parseInt(s,2);
    });
    //console.log( bytes );
    bytes.forEach( (b,i) => {
      bytes[i] = String.fromCharCode( b );
    });
    //console.log( btoa( bytes.join('' ) ) );
    return btoa( bytes.join('') );
  }

  function parse( state ) {
    const { url } = state;
    if ( url.indexOf('://') == -1 ) {
      throw new TypeError('Only accept authority URLs with <scheme>://');
    }
    const [ scheme, schemeless ] = url.split( /:\/\/(.+)/ );
    //console.log(scheme,schemeless);
    const [ hostport, hostless ] = schemeless.split(/\/(.+)/ );
    //console.log(hostport,hostless)
    const [ host, port ] = hostport.split(/:(.+)/);
    //console.log(host,port)
    const [ path, pathless ] = hostless.split(/\?(.+)/);
    //console.log(path,pathless)
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
    } else if ( state.url.scheme == 'http' ) {
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
      const codes = part_codes[partname+'_codes'];
      state[partname+'code'] = shrink( part, codes );
      state.code += state[partname+'code'];
      state.code += codes.part_divider;
    }
  }

  function code_parts( state ) {
    const partnames = ["host", "path", "query", "fragment"];
    for ( const partname of partnames ) {
      if ( partname == 'query' && state.query ) {
        code_query( state );
        state.code += state.query.coded;
      } else {
        code_part( state, partname );
      }
    }
  }

  function codeNum( v ) {
    return v.toString(36);
  }

  function code_query( state ) {
    const query = state.url.query;

    if ( ! query ) {
      return;
    }

    let numbers = false;
    let multi = false;
    const slots = query.split( '&' );
    const pairs = slots.map( slot => slot.split('=') );
    const order = [];
    const map = pairs.reduce( (m,p) => {
      const [ name, value ] = p;
      let val = value;
      if ( parseInt(val).toString() == val ) {
        numbers = true;
        val = parseInt(val);
      }
      if ( name in m ) {
        if ( ! multi ) {
          multi = true;
        }
        let current = m[name];
        if ( !Array.isArray( current ) ) {
          current = [ current ]; 
        }
        current.push( val );
        m[name] = current;
      } else {
        m[name] = val;
        order.push( name );
      }
      return m;
    }, {});
    const dividers = gen_dividers( query, multi, numbers, true );
    const these_codes = Object.assign({}, query_codes);
    const names = [ 'slot', 'array', 'number', 'part' ];
    dividers.forEach( (d,i) => {
      these_codes[d] = these_codes[names[i]+'_divider'];
    });
    delete these_codes['slot_divider'];
    delete these_codes['array_divider'];
    delete these_codes['number_divider'];
    delete these_codes['part_divider'];
    //console.log( these_codes, dividers );
    let compact = '';
    for( const name of order ) {
      compact += name + dividers[0]; 
      const vals = map[name];
      if ( Array.isArray( vals ) ) {
        compact += vals.map( val => Number.isInteger( val ) ? dividers[2] + codeNum(val) : val ).join( dividers[1] );
      } else {
        if ( Number.isInteger( vals ) ) {
          compact += dividers[2] + codeNum(vals);
        } else {
          compact += vals;
        }
      }
      if ( name !== order.slice(-1)[0] ) {
        compact += dividers[0];
      } else {
        compact += dividers[3];
        //console.log( dividers, compact );
      }
    }
    const coded = shrink( compact, these_codes );
    //console.log(coded);
    state.query = {
      compact, dividers, coded
    };
  }

  function stringify( state ) {
    state.string = tostring( state );
  }

  function toOctet( byte, isLast, last_length ) {
    const bits = byte.toString(2);
    if ( !isLast ) {
      const prefix = 8 - bits.length;
      return Array(prefix+1).join('0') + bits;
    } else {
      const prefix = last_length - bits.length;
      //console.log( "LAST", prefix, last_length, bits.length );
      const last_bits = Array(prefix+1).join('0') + bits;
      //console.log( "last bits", last_bits, prefix, last_length, last_bits.length, bits );
      return last_bits;
    }
  }

  function lengthen( s ) {
    const bytes = atob( s ).split('').map( b => b.codePointAt( 0 ) );
    //console.log( ">", bytes );
    const header = bytes.slice(0,2).map( b => toOctet(b) ).join('');
    let last_octet_length = parseInt(header.slice(6,9),2);
    if ( last_octet_length == 0 ) {
      last_octet_length = 8;
    }
    //console.log( "LO", last_octet_length );
    const bits = bytes.map( (b,i) => toOctet( b, i == bytes.length - 1, last_octet_length ) );
    const bs = bits.join('');
    //console.log('bs', bs);
    return bs;
  }

  function decode_part( bs, part_tree ) {
    let decoded = '';
    let part_decoder = part_tree;
    let part = '';
    buildpart: while( true ) {
      let code = '';
      buildcode: while( !part_decoder.morpheme ) {
        const next_bit = bs.splice(0,1)[0] == '0' ? 'left' : 'right';  
        part_decoder = part_decoder[next_bit];
      }
      code = part_decoder.morpheme;
      // FIXME: need another termination condition for this buildpart
        // otherwise it's vulernable to infinite looping via maliciously-constructed
        // -string attacks
      if ( code == 'part_divider' ) {
        break buildpart;
      } else {
        part += code;
        //console.log( code, part );
        part_decoder = part_tree;
      }
    }
    //console.log( part );
    decoded += part;
    //console.log( decoded );
    return decoded;
  }

  function decode_query( bs, query_tree ) {
    let query_decoder = query_tree;
    let query = '';
    let count = 0;
    let decoded = '';
    buildquery: while( true ) {
      let code = '';
      buildcode: while( !query_decoder.morpheme ) {
        const next_bit = bs.splice(0,1)[0] == '0' ? 'left' : 'right';  
        query_decoder = query_decoder[next_bit];
      }
      code = query_decoder.morpheme;
      // FIXME: need another termination condition for this buildquery
        // otherwise it's vulernable to infinite looping via maliciously-constructed
        // -string attacks
      if ( code == 'slot_divider' ) {
        count += 1;
        if ( count % 2 == 0 ) {
          query += '&';
        } else {
          query += '=';
        }
        query_decoder = query_tree;
      } else if ( code == 'part_divider' ) {
        break buildquery;
      } else {
        query += code;
        //console.log( code, query );
        query_decoder = query_tree;
      }
    }
    //console.log( query );
    decoded += query;
    //console.log( decoded );
    return decoded;
  }

  function decode_tld( bs ) {
    const tld_bit0 = bs.splice(0, 1 )[0];
    let tld_groupname;
    if ( tld_bit0 == '0' ) {
      tld_groupname = 'original'; 
    } else {
      const tld_bit1 = bs.splice(0, 1)[0];
      if ( tld_bit1 == '1' ) {
        tld_groupname = 'rest';
      } else {
        tld_groupname = 'other_common';
      }
    }
    //console.log( 'g', tld_groupname );
    let tld_decoder = tld_tree[tld_groupname+"_root"];  
    //console.log('d', tld_decoder);
    while( !tld_decoder.tld ) {
      const next_bit = bs.splice(0,1)[0] == '0' ? 'left' : 'right';
      tld_decoder = tld_decoder[next_bit];
      //console.log(tld_decoder);
    }
    const tld = tld_decoder.tld;
    //console.log( tld );
    return tld;
  }

  function decode_presence( bs ) {
    const presence = parseInt(bs.splice(0, 4).join(''));
    return [ 
      presence & 8,
      presence & 4,
      presence & 2,
      presence & 1
    ];
  }

  function decode_version( bs ) {
    const index_of_first_zero = bs.findIndex( b => b == '0' );
    const version_prefix = bs.splice(0, index_of_first_zero + 1 );
    const version = version_prefix.reduce( (v,b) => v + parseInt(b), 0 );
    return version;
  }

  function decode_scheme( bs ) {
    return bs.splice(0, 1) == '1' ? 'https://' : 'http://';
  }

  function decode( s ) {
    const bs = lengthen(s).split('');
    let decoded = '';
    const format_version = decode_version( bs );
    console.log( "Version", format_version );
    const [ has_port, has_path, has_query, has_fragment ] = decode_presence( bs );
    //console.log( presence );
    const last_octet_length = parseInt(bs.splice(0, 3).join(''), 2);
    //console.log( last_octet_length );
    
    const scheme = decode_scheme( bs );
    //console.log( scheme );
    decoded += scheme;
    const tld = decode_tld( bs );
    decoded += decode_part( bs, host_tree ) + tld;
    //console.log( decoded );
    if ( has_path ) {
      decoded += '/' + decode_part( bs, path_tree );
    }
    if ( has_query ) {
      decoded += '?' + decode_query( bs, query_tree );
    }
    if ( has_fragment ) {
      decoded += '#' + decode_part( bs, fragment_tree );
    }
    return decoded;
  }

  function encode( url ) {
    const state = {
      url,
      code: '10'
    };
    parse(state);
    code_scheme(state);
    code_tld( state );
    code_parts( state );
    stringify( state );
    console.log(state);
    return state.string;
  }

  function cli() {
    const url = process.argv[2];
    const encoded = encode( url );
    const decoded = decode( encoded );
    console.log( JSON.stringify( [ url, encoded, decoded ], null, 2 ) );
  }

  module.exports = { urizip: {
    encode, decode
  }};
}
