#include "emscripten.h"
#include <stdlib.h>
#include <stdint.h>
#include "ext/ccrypt/ccryptlib.h"

#define KEY "r0ckrobo#23456"

EMSCRIPTEN_KEEPALIVE
int version() {
  return 1;
}

EMSCRIPTEN_KEEPALIVE
uint8_t* create_buffer(int length) {
  return malloc(length * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t* p) {
  free(p);
}

EMSCRIPTEN_KEEPALIVE
uint8_t read_from_buffer(uint8_t* buffer, int offset) { //this just serves as a sanity check
    return buffer[offset];
}


EMSCRIPTEN_KEEPALIVE
void decrypt(uint8_t* inBuffer, uint8_t* outBuffer, unsigned int size) {
    ccrypt_stream_t ccrypt;
    
    ccrypt.next_in = (char *)inBuffer;
    ccrypt.next_out = (char *)outBuffer;
    ccrypt.avail_in = size;
    ccrypt.avail_out = size - 32;
    
    
    ccdecrypt_init(&ccrypt, KEY, 0);
    ccdecrypt(&ccrypt);
    ccdecrypt_end(&ccrypt);
}

EMSCRIPTEN_KEEPALIVE
void encrypt(uint8_t* inBuffer, uint8_t* outBuffer, unsigned int size) {
    ccrypt_stream_t ccrypt;
    
    ccrypt.next_in = (char *)inBuffer;
    ccrypt.next_out = (char *)outBuffer;
    ccrypt.avail_in = size;
    ccrypt.avail_out = size + 32;
    
    
    ccencrypt_init(&ccrypt, KEY);
    ccencrypt(&ccrypt);
    ccencrypt_end(&ccrypt);
}