package com.tridev.rpgg;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RoomServerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
