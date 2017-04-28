"use strict";
{
  const fs = require('fs');
  const tld_stats = JSON.parse( fs.readFileSync( 'tld_stats.json', { encoding: 'utf8' } ) );

  let total = 0;
  for( const tld_name of Object.keys( tld_stats ) ) {
    total += tld_stats[tld_name]; 
  }

  const minimum = 1/total;

  for( const tld_name of Object.keys( tld_stats ) ) {
    tld_stats[tld_name] = tld_stats[tld_name]/total;
  }

  function get_freq( tld_name ) {
    if ( tld_name in tld_stats ) {
      return tld_stats[tld_name];
    } else {
      const tld_parts = tld_name.split('.').filter( part => part.length > 0 );
      let approximate = 1.0;
      for ( const part of tld_parts ) {
        const part_name = "." + part;
        if ( part_name in tld_stats ) {
          approximate *= tld_stats[part_name];
        } else {
          approximate = minimum;
          break;
        }
      }
      return approximate;
    }
  }

  // data 
    // 8 ( 3 bits ) original and infrastructure
    const original = {
      ".com": "000",
      ".org": "001",
      ".gov": "010",
      ".net" : "011",
      ".int": "100",
      ".edu": "101",
      ".mil": "110",
      ".arpa": "111"
    };

    // 16 ( 4 bits ) other common 
    const other_common = {
      ".gov.uk": "0000",
      ".co.uk": "0001",
      ".co.jp": "0010",
      ".gov.au": "0011",
      ".com.au": "0100",
      ".co.nz": "0101",
      ".govt.nz": "0110",
      ".in": "0111",      // india
      ".co": "1000",
      ".ru": "1001",      // russia
      ".com.cn": "1010",    // china
      ".com.hk": "1011",    // china
      ".io": "1100",      // startups
      ".gl": "1101",      // goo.gl
      ".ly": "1110",      // bit.ly
      ".be": "1111",      // youtu.be
    };

  // extraction and processing

    const tld_raw = fs.readFileSync( 'tld.dat', { encoding: 'utf8' } ).split( /\n/g );
    const tld_names = tld_raw.filter( line => {
      const isEmpty = line.trim().length == 0;
      const isComment = line.startsWith( '//' );
      return ! ( isEmpty || isComment );
    }).sort();
    const rest = tld_names.reduce( (r,a) => (r[a] = 1, r ), {} );

    const tlds = {
      original,
      other_common,
      rest
    };

  // add frequencies
    
    const output_tlds = {};
    for( const dict_name of Object.keys( tlds ) ) {
      const output = [];
      output_tlds[dict_name] = output;
      const dict = tlds[dict_name];
      for( let tld_name of Object.keys( dict ) ) {
        if ( tld_name.startsWith( '!' ) ) {
          continue;
        } else if ( tld_name.startsWith( '*' ) ) {
          tld_name = tld_name.slice(1);
        }
        if ( ! tld_name.startsWith('.') ) {
          tld_name = '.' + tld_name;
        }
        output.push({ tld: tld_name, cover: get_freq( tld_name ) });
      }
    }


  // output


  // there are around 8100 of these so we need 13 bits.
  // but we shall huff code it, to get max 14 bits, min...some amount less
  console.log( JSON.stringify( output_tlds, null, 2 ) );
}
