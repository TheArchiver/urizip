"use strict";
{
  const btoa = require('btoa');

  // to find a radix we must have 
  // a window of the source
  // the symbols have a limited range within that window
  // and that range is a subset of the alphabet

  // We detect a radix, turn it into an integer to save space.
  const M = Number.MAX_SAFE_INTEGER;

  // we need to chunk it and determine chunk size

  function chunk_size( radix_size ) {
    // how many symbols can we process at once to stay under M?
    return Math.floor( Math.log( M ) / Math.log( radix_size ) );
  }

  function ensureWidth( w, bits ) {
    const prefix = w - bits.length;
    return Array(prefix+1).join('0') + bits;
  }

  function bit_size( radix_size ) {
    const max_chunk = Math.pow( radix_size, chunk_size( radix_size ) );
    return max_chunk.toString(2).length;
  }

  function chunk( s, size ) {
    const chunks = [];
    const si = s.split('');
    while( si.length ) {
      chunks.push( si.splice(0, size ) );
    }
    return chunks;
  }

  function encode_digits( s ) {
    const vals = chunk( s, chunk_size( 10 ) ).map( si => parseInt( si.join(''), 10 ) );
    const val_bits = vals.map( val => val.toString(2) );
    const chunk_bit_count = bit_size( 10 );
    const bit_chunks = val_bits.map( bits => ensureWidth( chunk_bit_count, bits ) );
    return bit_chunks;
  }

  function encode_hex_lower( s ) {
    const vals = chunk( s, chunk_size( 16 ) ).map( si => parseInt( si.join(''), 16 ) );
    const val_bits = vals.map( val => val.toString(2) );
    const chunk_bit_count = bit_size( 16 );
    const bit_chunks = val_bits.map( bits => ensureWidth( chunk_bit_count, bits ) );
    return bit_chunks;
  }

  function encode_hex_upper( s ) {
    const vals = chunk( s, chunk_size( 16 ) ).map( si => parseInt( si.join(''), 16 ) );
    const val_bits = vals.map( val => val.toString(2) );
    const chunk_bit_count = bit_size( 16 );
    const bit_chunks = val_bits.map( bits => ensureWidth( chunk_bit_count, bits ) );
    return bit_chunks;
  }

  function encode_base36( s ) {
    const vals = chunk( s, chunk_size( 36 ) ).map( si => parseInt( si.join(''), 36 ) );
    const val_bits = vals.map( val => val.toString(2) );
    const chunk_bit_count = bit_size( 36 );
    const bit_chunks = val_bits.map( bits => ensureWidth( chunk_bit_count, bits ) );
    return bit_chunks;
  }

  function encode_base62( s ) {

  }

  function encode_base64_custom( s ) {

  }

  function encode_custom_radix( s, alphabet ) {

  }

  function detect_limited_alphabet_sections( s ) {

  }

  function test() {
    const radices = [10,16,32,36,64];
    console.log( radices );
    console.log( radices.map( r => chunk_size( r ) ) );
    console.log( radices.map( r => bit_size( r ) ) );
    const x = "347856348956345897463587934658937465782394";
    console.log( x );
    const xc = encode_digits( x );
    console.log( ( xc.join('').length / 8 ) / x.length * 4/3 );
    const y= "fgdkjh3495872346jsdfhgekjr2397846wfgjhwegf234kjrf678reftg";
    console.log( y );
    const yc = encode_base36( y );
    console.log( ( yc.join('').length / 8 ) / y.length * 4/3 );
  }


  test();
}
