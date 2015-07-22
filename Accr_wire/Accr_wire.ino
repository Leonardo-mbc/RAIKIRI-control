#define MOVING_STEPS 30
#define LEARN_STEPS 500
#define BURN_IN 100
#define TIMEING_VALUE 100000 // 10000000 is 1sec, 1000 is 1msec, 1 is 1microsec

#define ENABLE_MOVEAVG false
#define LOWPASS_FILTER false
#define ZEROS_MOD false
#include <Wire.h>

int led = 13, sgn = 10;
int step = 0, burn_in = BURN_IN, zeros_learn_steps = LEARN_STEPS;
const int LIS3DH_ADDR = 0x18;
byte addr_map[6] = {0x28, 0x2A, 0x2C, 0x29, 0x2B, 0x2D};
unsigned long run_time = 0, hold_time = 0, proc_time = 0, keep_time = 0, block_time = 0;
boolean burnining = false, make_zeros = false;

float acclr[3] = {0.0, 0.0, 0.0};
float zeros[3] = {0.0, 0.0, 0.0};
float prev[3] = {0.0, 0.0, 0.0};
float speed[3] = {0.0, 0.0, 0.0};

int moving_steps[3][MOVING_STEPS];
long integral[3] = {0.0, 0.0, 0.0};
unsigned long integral_count = 0;
int l, h;

unsigned int readRegister(byte reg)
{
    Wire.beginTransmission(LIS3DH_ADDR);
    Wire.write(reg);
    Wire.endTransmission(false);
    
    Wire.requestFrom(LIS3DH_ADDR, 1, false);
    Wire.endTransmission(true);
    return Wire.read();
}

void writeRegister(byte reg, byte data)
{
    Wire.beginTransmission(LIS3DH_ADDR);
    Wire.write(reg);
    Wire.write(data);
    Wire.endTransmission(false);
}

void setup()
{
    Wire.begin();
    Serial.begin(57600);
    pinMode(led, OUTPUT);
    pinMode(sgn, OUTPUT);
    
    int res = readRegister(0x0F);
    if(res == 0x33) {
       // Connection success.
      Serial.println("Success.");
      writeRegister(0x20, 0x7F);
      Serial.print("Burn in");
    } else {
      // Connection failed.
      Serial.println(res, HEX);
    }
}

void loop()
{
  String xyz_value = "";
  String speed_value = "";
  
  if(burnining && make_zeros) {
    /** MAIN STEP ********/
    for(int axis=0; axis<3; axis++) {
      l = readRegister(addr_map[axis]);
      h = readRegister(addr_map[axis + 3]);
      
      if(ENABLE_MOVEAVG) {
        acclr[axis] = 0;
        moving_steps[axis][step] = h << 8 | l;
        for(int local_step = 0; local_step < MOVING_STEPS; local_step++) acclr[axis] += moving_steps[axis][local_step] / float(MOVING_STEPS);
      } else {
        acclr[axis] = (h << 8 | l) / 16384.0 * 9.8;
      }
      if(ZEROS_MOD) acclr[axis] = acclr[axis] - zeros[axis];
      if(LOWPASS_FILTER) acclr[axis] = (prev[axis] * 0.9) + ((acclr[axis]) * 0.1);
      
      integral[axis] += acclr[axis];
      integral_count += 1;
    }
    
    for(int axis = 0; axis < 3; axis++) {
      xyz_value += String(acclr[axis]) + " ";
      prev[axis] = acclr[axis];
    }
    //Serial.println(/*"axis: " + */xyz_value + String(proc_time));
    
    run_time = micros() / TIMEING_VALUE;
    //Serial.println(String(run_time) +", "+ hold_time);
    if(run_time - 1 == hold_time) {
      hold_time = run_time;
      
      for(int axis = 0; axis < 3; axis++) {
        speed[axis] = float(integral[axis]) / float(integral_count);
        speed_value += String(speed[axis]) + " ";
        integral[axis] = 0;
      }
      integral_count = 0;
      Serial.println("speed: " + speed_value);
      // スピード出力 //if(speed[1] < 1000000) Serial.println(speed[1]);
    }
    
    if(ENABLE_MOVEAVG) {
      if(step < MOVING_STEPS - 1) step += 1;
        else step = 0;
    }
    
    /** proc ****/
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
          prev[1] = 0;
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
      /**** proc stop ****/
      digitalWrite(led, LOW);
      digitalWrite(sgn, LOW);
    }
    /**** proc **/
      
    /******** MAIN STEP **/
  } else if(burnining) {
    /** LEARNING ZEROS STEP ********/
    /*
    if(zeros_learn_steps % (LEARN_STEPS / 10) == 0) Serial.print('.');
    for(int axis = 0; axis < 3; axis++) {
        l = readRegister(addr_map[axis]);
        h = readRegister(addr_map[axis + 3]);
        zeros[axis] += float(h << 8 | l) / float(LEARN_STEPS);
    }
    
    zeros_learn_steps -= 1;
    if(zeros_learn_steps == 0) {
      Serial.println('.');*/
      for(int x= 0; x < 5; x++) {
          digitalWrite(led, HIGH);
          delay(100);
          digitalWrite(led, LOW);
          delay(100);
      }
      
      make_zeros = true;
      /*
      Serial.print("zeros: [");
      for(int axis = 0; axis < 3; axis++) {
        Serial.print(zeros[axis]);
        Serial.print(" ");
      }
      Serial.println("]");
      */
      hold_time = micros() / TIMEING_VALUE;
    //}
    /******** LEARNING ZEROS STEP **/
  } else {
    /** BURN IN SETP ********/
    if(burn_in % (BURN_IN / 10) == 0) Serial.print('.');
    for(int axis = 0; axis < 3; axis++)
    {
        l = readRegister(addr_map[axis]);
        h = readRegister(addr_map[axis + 3]);
    }
    burn_in -= 1;
    if(burn_in == 0)
    {
        burnining = true;
        Serial.println('.');
        //Serial.print("Zeros Learning");
    }
    /******** BURN IN SETP **/
  }
}
