# TODO

-- Add a way to parse and save query parameters....using special format.
-- Add detection for numbers and encode them using 3 or 4 bits per number. 
-- Add detection for GUIDs or any hex sequence. And encode as a number.
-- We can save on the query parameters if we encode that block specially. 
For example, we encode escapes as normal. We encode & variable = value as
0|variable|0|value

We have a separate morpheme block for every section of the URI.

Right now I'm getting consistently below parity (50 - 88%) or original. This is great. considering we are base64 encoding.


DONE We need something like bitfields. Like huffman coding. And common words.

Morphemes

  Implemented a way to do huffman coding over morphines.

  What I really like about this is how the first 1024 most frequent morphemes actually cover 50% of the space for all english words boosted by the 10000 most common words.

  Fuck yeah amazing.

  And so the maximum we can code a morpheme is 11 bits. 

  I have a hunch that 11 bits per morpheme is actually pretty close to the ideal entropy for morphemes in English.

  I see someone quote a value of 11.82 bits of entropy per word in English. Considering that a morpheme is the minimal semantic unit, I'd say we're on track.

  Also, we are not using actual morphemes, just approximations of morphemes, found using frequent factor factorization ( via the LZ algorithm ) of English words. The assumption is that morphemes are repetitive, reused units of words. So basically, since our assumption matches the definition of morphemes, we are using morphemes. However, there may be some cases that escape this definition ( such as morphemes that change depending on context and therefore are not amenable to discovery using frequent factor factorization ), and there may be cases where our model of morphemes is only an approximation to the true semantic units. 

  However, I feel it shall work rather well.

More Stuff

There is still a lot more to do.

Encoding ( and devising a format for ) the common URI parts like

http or https
: / #
. - _ :
[0-9]
& = %
com org net ( other TLDs and c c TLDs )
www mail accounts new ( and so on ) 
html jpeg ico mp4 ( and so on )
And so on

But overall once this encoding is down, I think we will have something.

I need to insert the common URI symbols into the top of my dict. And push out the least common at the bottom.
And recalculate.

I need to have a switch to indicate we are going to "unencoded" like the YOUTUBE uri part and so on. No point encoding that. 

In a way it's really just binary storage of URLs, with a plug in to compress english language sections.

It's really just a compact binary encoding for URIs. 

We generate the uniquely decodable bit stream. Then sift it through base 64.

Then we make that a single page application. 


That can decode such a URI and show a link on the page for it.

And also has a input for a URI so you can form your encoded one as well.


