"use strict";
{
const btoa = require('btoa');
const atob = require('atob');
const fs = require('fs');
const tld_tree = JSON.parse( fs.readFileSync( 'tld_tree.json', {encoding:'utf8'} ) );
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
      console.log( longest, codes[code] );
      encoding += codes[longest];
      code = word[i] || '';
    }
  }
  if ( code.length ) {
    console.log( code, codes[code] );
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

function gen_dividers( s, array, numbers ) {
  const dividers = [ gen_divider( s ) ];  
  if ( array ) {
    dividers[1] = gen_divider( s, dividers );
  }
  if ( numbers ) {
    dividers[2] = gen_divider( s, dividers );
  }
  return dividers;
}

function tostring( bits ) {
  const bytes = [];
  bits = bits.split('');
  while( bits.length ) {
    const octet = bits.splice(0,8);
    bytes.push( octet.join('') );
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
    if ( partname == 'query' ) {
      code_query( state );
      state.code += state.query.coded + query_codes.part_divider;
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
  const dividers = gen_dividers( query, multi, numbers );
  const these_codes = Object.assign({}, query_codes);
  const names = [ 'slot', 'array', 'number' ];
  dividers.forEach( (d,i) => {
    these_codes[d] = these_codes[names[i]+'_divider'];
  });
  delete these_codes['slot_divider'];
  delete these_codes['array_divider'];
  delete these_codes['number_divider'];
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
    compact += dividers[0];
  }
  const coded = shrink( compact, these_codes );
  state.query = {
    compact, dividers, coded
  };
}

function stringify( state ) {
  state.string = tostring( state.code );
}

function toOctet( byte ) {
  const bits = byte.toString(2);
  const prefix = 8 - bits.length;
  return Array(prefix+1).join('0') + bits;
}

function lengthen( s ) {
  const bytes = atob( s ).split('').map( b => b.codePointAt( 0 ) );
  //console.log( ">", bytes );
  const bits = bytes.map( (b,i) => toOctet( b ) );
  return bits.join('');
}

function decode( bs ) {
  bs = bs.split(''); 
  const format_version = bs.splice(0, 2);
  console.log( "Version", format_version );
  const presence = bs.splice(0, 4);
  console.log( presence );
  const scheme = bs.splice(0, 1) == '1' ? 'https://' : 'http://';
  console.log( scheme );
  const tld_bit0 = bs.splice(0, 1 )[0];
  let tld_groupname;
  if ( tld_bit0 == '0' ) {
    tld_groupname = 'original'; 
  }
  console.log( tld_groupname );
  let tld_decoder = tld_tree[tld_groupname+"_root"];  
  while( !tld_decoder.morpheme ) {
    const next_bit = bs.splice(0,1)[0] == '0' ? 'left' : 'right';
    tld_decoder = tld_decoder[next_bit];
  }
  const tld = tld_decoder.morpheme;
  console.log( tld );
}
function test() {
  parse(state);
  code_scheme(state);
  code_tld( state );
  code_parts( state );
  stringify( state );
  console.log(state);
  const bits = lengthen( state.string );
  const deocded = decode( bits );
}


test()
}
