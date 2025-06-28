MOV R7, #27        ; Cols
MOV R8, #8         ; Rows
MOV R9, #0xA00     ; Current position index

MOV R10, #0        ; direction: 0=right, 1=down, 2=left, 3=up
MOV R11, #0        ; x
MOV R12, #0        ; y

loop:
    ; Erase tail
    MOV R0, R20
    MOV R1, R21
    MOV R2, #0
    BL plot_at
    ; Shift body
    MOV R20, R22
    MOV R21, R23
    MOV R22, R24
    MOV R23, R25
    MOV R24, R11
    MOV R25, R12
    ; Draw head
    MOV R0, R11
    MOV R1, R12
    MOV R2, #0x23
    BL plot_at
    ; Movement
    CMP R10, #0
    BEQ right
    CMP R10, #1
    BEQ down
    CMP R10, #2
    BEQ left
    B up
right:
    ADD R11, R11, #1
    CMP R11, #27
    BLT loop
    MOV R11, #26
    ADD R10, R10, #1
    B loop
down:
    ADD R12, R12, #1
    CMP R12, #9
    BLT loop
    MOV R12, #7
    ADD R10, R10, #1
    B loop
left:
    SUB R11, R11, #1
    CMP R11, #-1
    BGT loop
    MOV R11, #0
    ADD R10, R10, #1
    B loop
up:
    SUB R12, R12, #1
    CMP R12, #-1
    BGT loop
    MOV R12, #0
    MOV R10, #0
; R0 = x, R1 = y, R2 = value
plot_at:
    MUL R3, R1, R7
    ADD R3, R3, R0
    ADD R3, R3, R9
    STRB R2, R3
    BX LR
