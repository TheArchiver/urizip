"use strict";
{
  const fs = require('fs');
  const raw_words = fs.readFileSync( process.argv[2], { encoding: 'utf8' });
  const word_lines = raw_words.split(/\n/g).map( line => line.trim() );
  const ok_words = word_lines.filter( word => ! /['"]/.test( word ) );
  const MAX = 4;
  const BOOST = 334;
  const dict = {};
  ok_words.forEach( word => {
    let w = '';
    for ( const char of word ) {
      if ( !(char in dict) ) {
        dict[char] = 1; 
      } else {
        dict[char] += 1;
      }
      if ( w+char in dict && w.length < MAX ) {
        w = w+char; 
        dict[w] += 1;
      } else {
        dict[w+char] = ( dict[w+char] || 0 ) + 1;
        w = char;
      }
    }
    if ( w.length ) {
      dict[w] = ( dict[w] || 0 ) + 1;
    }
  });
  const raw_boost_words = fs.readFileSync( process.argv[3], { encoding: 'utf8' });
  const boost_word_lines = raw_boost_words.split(/\n/g).map( line => line.trim() );
  const ok_boost_words = boost_word_lines.filter( word => ! /['"]/.test( word ) );
  ok_boost_words.forEach( word => {
    let w = '';
    for ( const char of word ) {
      if ( w+char in dict && w.length < MAX ) {
        w = w+char; 
        dict[w] += BOOST;
      } else {
        dict[w+char] = ( dict[w+char] || 0 ) + BOOST;
        w = char;
      }
    }
    if ( w.length ) {
      dict[w] = ( dict[w] || 0 ) + BOOST;
    }
  });
  const morphemes = [];
  let total_cover = 0;
  for ( const morpheme of Object.keys( dict ) ) {
    const cover = dict[morpheme] * morpheme.length;
    if ( Number.isInteger(cover ) ) {
      total_cover += cover;
    } else {
      throw new TypeError( "not integer", morpheme, cover );
    }
    morphemes.push( { morpheme, cover } ); 
  }
  morphemes.push(
    ...("/-_.#".split('').map( char => ({morpheme: char, cover: total_cover * 0.05 }) )),
    ...("&=%?".split('').map( char => ({morpheme: char, cover: total_cover * 0.005 }) )),
    ...("0123456789".split('').map( char => ({morpheme: char, cover: total_cover * 0.015 }) ))
  );
  morphemes.sort( (a,b) => b.cover - a.cover );
  morphemes.length = 1024;
  morphemes.forEach( (m,i) => {
    morphemes[i] = { morpheme: m.morpheme, cover: m.cover / total_cover };
  });
  console.log( JSON.stringify( morphemes, null, 2 ));
}
