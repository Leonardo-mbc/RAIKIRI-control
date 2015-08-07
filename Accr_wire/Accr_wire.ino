#define MOVING_STEPS 30
#define ZEROS_LEARN_STEPS 500
#define BURN_IN 100
#define TIMEING_VALUE 100000 // 10000000 is 1sec, 1000 is 1msec, 1 is 1microsec

#define ENABLE_MOVEAVG false
#define LOWPASS_FILTER false
#define ZEROS_MOD false
#define LIS3DH_MAKE_SPEED true
#define SERIAL_OUTPUT true
#define OUTPUT_TYPE "json"
#include <Wire.h>

int led = 13, sgn = 8;
int step = 0, burn_in = BURN_IN, zeros_learn_steps = ZEROS_LEARN_STEPS;
const int LIS3DH_ADDR = 0x18;
const int L3GD20_ADDR = 0xD4 >> 1;

byte addr_map[6] = { 0x28, 0x2A, 0x2C, 0x29, 0x2B, 0x2D };
unsigned long run_time = 0, hold_time = 0, proc_time = 0, keep_time = 0, block_time = 0;
boolean burnining = false, make_zeros = false;

float acclr[3] = { 0.0, 0.0, 0.0 };
float rotation[3] = { 0.0, 0.0, 0.0 };

float LIS3DH_zeros[3] = { 0.0, 0.0, 0.0 };
float L3GD20_zeros[3] = { 0.0, 0.0, 0.0 };

float LIS3DH_prev[3] = { 0.0, 0.0, 0.0 };
float L3GD20_prev[3] = { 0.0, 0.0, 0.0 };

float speed[3] = { 0.0, 0.0, 0.0 };
long integral[3] = { 0.0, 0.0, 0.0 };
unsigned long integral_count = 0;

int LIS3DH_moving_steps[3][MOVING_STEPS];
int L3GD20_moving_steps[3][MOVING_STEPS];

int LIS3DH_l, LIS3DH_h, L3GD20_l, L3GD20_h;

unsigned int readRegister(int addr, byte reg)
{
    Wire.beginTransmission(addr);
    Wire.write(reg);
    Wire.endTransmission(false);
    
    Wire.requestFrom(addr, 1, false);
    Wire.endTransmission(true);
    return Wire.read();
}

void writeRegister(int addr, byte reg, byte data)
{
    Wire.beginTransmission(addr);
    Wire.write(reg);
    Wire.write(data);
    Wire.endTransmission(false);
}

void control_proc() {
  proc_time = micros() / 1000.0;
  if(block_time <= proc_time - keep_time) {
    
    if(speed[1] < 1000000) {  // remove noise
      
      /** speed control ****/
      if(0.80 < speed[1]) {
        digitalWrite(led, HIGH);
        digitalWrite(sgn, HIGH);
        keep_time = proc_time;
        block_time = 500;
        delay(100);
        
        speed[1] = 0;
        LIS3DH_prev[1] = 0;
        acclr[1] = 0;
        
      } else {
        digitalWrite(led, LOW);
        digitalWrite(sgn, LOW);
      }
      /****  control **/
      
      /** slope control ****/
      /*if(acclr[1] < -4000) {
        keep_time = proc_time;
        block_time = 1000;
      }*/
      /**** slope control **/
      
      /** balance control ****/
      /*if(acclr[0] < -2000 || 2000 < acclr[0]) {
        keep_time = proc_time;
        block_time = 500;
      }*/
      /**** balance control **/
    }
    
  } else {
    /**** motor stop ****/
    digitalWrite(led, LOW);
    digitalWrite(sgn, LOW);
  }
}

void setup()
{
    Wire.begin();
    Serial.begin(115200);
    pinMode(led, OUTPUT);
    pinMode(sgn, OUTPUT);

    int res;

    /***** LIS3DH SETUP ****/
    res = readRegister(LIS3DH_ADDR, 0x0F);
    if(res == 0x33) {
      // LIS3DH: Connection success.
      Serial.println("LIS3DH: Connection Successful.");
      writeRegister(LIS3DH_ADDR, 0x20, 0x7F);
      for(int x=0; x<1; x++) {
        digitalWrite(led, HIGH);
        delay(100);
        digitalWrite(led, LOW);
        delay(100);
      }
    } else {
      // LIS3DH: Connection failed.
      Serial.println("LIS3DH: Connection failed.");
      Serial.println(res, HEX);
    }

    /***** L3GD20 SETUP ****/
    res = readRegister(L3GD20_ADDR, 0x0F);
    if(res == 0xD4){
      Serial.println("L3GD20: Connection Successful.");
      writeRegister(L3GD20_ADDR, 0x20, 0x0F);
      for(int x=0; x<2; x++) {
        digitalWrite(led, HIGH);
        delay(100);
        digitalWrite(led, LOW);
        delay(100);
      }
    } else {
      // L3GD20: Connection failed.
      Serial.println("L3GD20: Connection failed.");
      Serial.println(res, HEX);
    }

    Serial.print("Burn in");
}

void loop()
{
  String xyz_value = "";
  String rpy_value = "";
  String speed_value = "";
  
  if(burnining && make_zeros) {
    /** MAIN STEP ********/
    for(int axis= 0 ; axis < 3; axis++) {
      LIS3DH_l = readRegister(LIS3DH_ADDR, addr_map[axis]);
      LIS3DH_h = readRegister(LIS3DH_ADDR, addr_map[axis + 3]);
      L3GD20_l = readRegister(LIS3DH_ADDR, addr_map[axis]);
      L3GD20_h = readRegister(LIS3DH_ADDR, addr_map[axis + 3]);
      
      if(ENABLE_MOVEAVG) {
        /***** use move_avg *****/
        acclr[axis] = 0;
        rotation[axis] = 0;
        
        LIS3DH_moving_steps[axis][step] = (LIS3DH_h << 8 | LIS3DH_l) / 16384.0 * 9.8;
        L3GD20_moving_steps[axis][step] = L3GD20_h << 8 | L3GD20_l;
        
        for(int local_step = 0; local_step < MOVING_STEPS; local_step++) {
          acclr[axis] += LIS3DH_moving_steps[axis][local_step] / float(MOVING_STEPS);
          rotation[axis] += L3GD20_moving_steps[axis][local_step] / float(MOVING_STEPS);
        }

        if(step < MOVING_STEPS - 1) step += 1;
          else step = 0;
          
      } else {
        /***** use normal_value *****/
        acclr[axis] = (LIS3DH_h << 8 | LIS3DH_l) / 16384.0 * 9.8;
        rotation[axis] = L3GD20_h << 8 | L3GD20_l;
      }
      
      if(ZEROS_MOD) {
        acclr[axis] = acclr[axis] - LIS3DH_zeros[axis];
        rotation[axis] = rotation[axis] - L3GD20_zeros[axis];
      }
      
      if(LOWPASS_FILTER) {
        acclr[axis] = (LIS3DH_prev[axis] * 0.9) + ((acclr[axis]) * 0.1);
        rotation[axis] = (L3GD20_prev[axis] * 0.9) + ((rotation[axis]) * 0.1);
      }
      
      if(LIS3DH_MAKE_SPEED) {
        integral[axis] += acclr[axis];
        integral_count += 1;
      }

      xyz_value += String(acclr[axis]) + " ";
      rpy_value += String(rotation[axis]) + " ";
      
      LIS3DH_prev[axis] = acclr[axis];
      L3GD20_prev[axis] = rotation[axis];
    }

    if(LIS3DH_MAKE_SPEED) {
      /***** make speed *****/
      run_time = micros() / TIMEING_VALUE;
      if(run_time - 1 == hold_time) {
        hold_time = run_time;
        
        for(int axis = 0; axis < 3; axis++) {
          speed[axis] = float(integral[axis]) / float(integral_count);
          speed_value += String(speed[axis]) + " ";
          integral[axis] = 0;
        }
        integral_count = 0;
        if(SERIAL_OUTPUT) {
          if(OUTPUT_TYPE == "json") Serial.println("{ \"speed\": { \"x\": "+ String(speed[0]) +", \"y\": "+ String(speed[1]) +", \"z\": "+ String(speed[2]) +"}}");
            else Serial.println("speed: " + speed_value);
        }
      }
    } else {
      /***** output acclr *****/
      if(SERIAL_OUTPUT) {
        if(OUTPUT_TYPE == "json") Serial.println("{ \"acclr\": { \"x\": "+ String(acclr[0]) +", \"y\": "+ String(acclr[1]) +", \"z\": "+ String(acclr[2]) +"}}");
          else Serial.println("acclr: " + xyz_value + String(proc_time));
      }
    }

    /*if(SERIAL_OUTPUT) {
      if(OUTPUT_TYPE == "json") Serial.println("{ \"rotation\": { \"roll\": "+ String(acclr[0]) +", \"pitch\": "+ String(acclr[1]) +", \"yaw\": "+ String(acclr[2]) +"}}");
          else Serial.println("rotation: " + rpy_value + String(proc_time));
    }*/

    /** proc ****/
    
    control_proc();
    
    /**** proc **/
      
    /******** MAIN STEP **/
  } else if(burnining) {
    /** LEARNING ZEROS STEP ********/
    
    if(ZEROS_MOD) {
      if(zeros_learn_steps % (ZEROS_LEARN_STEPS / 10) == 0) Serial.print('.');
      for(int axis = 0; axis < 3; axis++) {
          LIS3DH_l = readRegister(LIS3DH_ADDR, addr_map[axis]);
          LIS3DH_h = readRegister(LIS3DH_ADDR, addr_map[axis + 3]);
          L3GD20_l = readRegister(L3GD20_ADDR, addr_map[axis]);
          L3GD20_h = readRegister(L3GD20_ADDR, addr_map[axis + 3]);
          
          LIS3DH_zeros[axis] += float((LIS3DH_h << 8 | LIS3DH_l) / 16384.0 * 9.8) / float(ZEROS_LEARN_STEPS);
          L3GD20_zeros[axis] += float(L3GD20_h << 8 | L3GD20_l) / float(ZEROS_LEARN_STEPS);
      }
      
      zeros_learn_steps -= 1;
      if(zeros_learn_steps == 0) {
        Serial.println('.');
  
        Serial.print("LIS3DH_zeros: [");
        for(int axis = 0; axis < 3; axis++) {
          Serial.print(LIS3DH_zeros[axis]);
          Serial.print(" ");
        }
        Serial.println("]");
        
        Serial.print("L3GD20_zeros: [");
        for(int axis = 0; axis < 3; axis++) {
          Serial.print(L3GD20_zeros[axis]);
          Serial.print(" ");
        }
        Serial.println("]");

        make_zeros = true;

        for(int x= 0; x < 5; x++) {
          digitalWrite(led, HIGH);
          delay(100);
          digitalWrite(led, LOW);
          delay(100);
        }

        hold_time = micros() / TIMEING_VALUE;
      }
    } else {
      make_zeros = true;

      for(int x= 0; x < 5; x++) {
        digitalWrite(led, HIGH);
        delay(100);
        digitalWrite(led, LOW);
        delay(100);
      }

      hold_time = micros() / TIMEING_VALUE;
    }
    /******** LEARNING ZEROS STEP **/
  } else {
    /** BURN IN SETP ********/
    if(burn_in % (BURN_IN / 10) == 0) Serial.print('.');
    for(int axis = 0; axis < 3; axis++) {
        LIS3DH_l = readRegister(LIS3DH_ADDR, addr_map[axis]);
        LIS3DH_h = readRegister(LIS3DH_ADDR, addr_map[axis + 3]);
        L3GD20_l = readRegister(L3GD20_ADDR, addr_map[axis]);
        L3GD20_h = readRegister(L3GD20_ADDR, addr_map[axis + 3]);
    }
    burn_in -= 1;
    if(burn_in == 0) {
        burnining = true;
        Serial.println('.');
        if(ZEROS_MOD) Serial.print("Zeros Learning");
    }
    /******** BURN IN SETP **/
  }
}
