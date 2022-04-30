Because the ccrypt encryption used by roborock v1 and s5 voicepacks is pretty obscure,
there are almost no implementations apart from the ccrypt one.

Thus, the easiest way of getting it to work with JS was to just compile that to WASM.<br/>
Thanks WASM.
<br/>
<br/>

Because I don't understand WASM, we just hardcode 64MB here.
That should be plenty for all voicepack needs.

`emcc -O3 -s TOTAL_MEMORY=64MB rrvoice.c ext/ccrypt/*.c --no-entry -o ../dist/rrvoice.wasm`

We also just commit the wasm so that we don't have to deal with it ever again.