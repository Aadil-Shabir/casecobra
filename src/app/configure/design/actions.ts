"use server";

import { db } from "@/db";
import { CaseColor, CaseFinish, PhoneModel, CaseMaterial } from "@prisma/client";

export type SaveConfigArgs = {
    color: CaseColor;
    finish: CaseFinish;
    material: CaseMaterial;
    model: PhoneModel;
    configId: string;
};

export async function saveConfig({ color, finish, material, model, configId }: SaveConfigArgs) {
    await db.configuration.update({
        where: { id: configId },
        data: { color, finish, model, material },
    });
}
