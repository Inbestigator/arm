; Requires a message loaded into memory beforehand
MOV R0, #0      ; Current letter index
MOV R1, #4096   ; Current frame index
LDR R2, R0      ; Load letter from mem
CMP R2, #59     ; Reset at semicolon in msg
MOVEQ R0, #-1
STRNE R2, R1    ; Place into frame buffer
ADD R0, R0, #1
ADD R1, R1, #1
CMP R1, #4204   ; Stop once it hits the bounds of the frame
BNE #-7