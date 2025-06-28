; Requires a message loaded into memory beforehand
MOV R0, #0          ; Current letter index
MOV R1, #0xA00      ; Current frame index
loop:
    LDRB R2, R0      ; Load letter from mem
    CMP R2, #59      ; Reset at semicolon in msg
    MOVEQ R0, #-1
    STRBNE R2, R1    ; Place into frame buffer
    ADD R0, R0, #1
    ADD R1, R1, #1
CMP R1, #0xAD8
BLT loop